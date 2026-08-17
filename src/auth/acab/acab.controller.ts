import { Controller, Get, Query, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AcabService, type AcabRefusal } from './acab.service';

/**
 * Parcours « Se connecter avec ACAB ».
 *
 * Les deux routes sont des navigations de navigateur, pas des appels d'API :
 * elles répondent par des redirections 302 ou une page HTML, jamais par du
 * JSON. C'est aussi pour ça que CORS ne les concerne pas.
 *
 * Deux modes d'ouverture :
 *   - pleine page  : redirections classiques, toujours disponible ;
 *   - fenêtre      : le courtier reste sur l'espace partenaires, le parcours
 *                    se déroule dans une fenêtre surgissante qui rend le
 *                    verdict par postMessage puis se ferme.
 *
 * Le `client_secret` ne sort jamais d'ici : l'échange du code se fait de
 * serveur à serveur dans AcabService, sans que le navigateur en voie la trace.
 */

/** Nonce anti-CSRF, déposé à l'aller et relu au retour. */
const COOKIE_NONCE = 'acab_nonce';
const COOKIE_PATH = '/api/v1/auth/acab';
const COOKIE_MAX_AGE_S = 600;

/** Reconnu par l'espace partenaires pour écarter les messages étrangers. */
const CANAL = 'lbassur-acab';

@ApiExcludeController()
@Controller('auth/acab')
export class AcabController {
  constructor(private readonly acab: AcabService) {}

  /** Lit un cookie sans dépendre de cookie-parser, absent du projet. */
  private static lireCookie(req: Request, nom: string): string | undefined {
    const brut = req.headers.cookie;
    if (!brut) return undefined;
    for (const morceau of brut.split(';')) {
      const sep = morceau.indexOf('=');
      if (sep === -1) continue;
      if (morceau.slice(0, sep).trim() === nom) {
        return decodeURIComponent(morceau.slice(sep + 1).trim());
      }
    }
    return undefined;
  }

  private static poserNonce(res: Response, valeur: string, maxAge: number): void {
    const securise = process.env.NODE_ENV === 'production';
    const attributs = [
      `${COOKIE_NONCE}=${encodeURIComponent(valeur)}`,
      `Path=${COOKIE_PATH}`,
      `Max-Age=${maxAge}`,
      'HttpOnly',
      // Lax et non Strict : le retour de l'ACAB est une navigation de premier
      // niveau depuis un autre domaine, et Strict retiendrait le cookie —
      // le nonce serait alors introuvable et toute connexion échouerait.
      'SameSite=Lax',
      ...(securise ? ['Secure'] : []),
    ];
    res.setHeader('Set-Cookie', attributs.join('; '));
  }

  /**
   * Sérialise pour insertion dans une balise <script>.
   *
   * JSON.stringify ne protège pas de « </script> » contenu dans une valeur :
   * le navigateur fermerait la balise au milieu des données. On neutralise
   * donc les caractères qui peuvent refermer une balise.
   */
  private static pourScript(valeur: unknown): string {
    return JSON.stringify(valeur)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  /**
   * Page rendue dans la fenêtre surgissante.
   *
   * Le verdict est transmis à la fenêtre parente avec une origine cible
   * EXPLICITE. Jamais « * » : le jeton d'un courtier partirait alors vers
   * n'importe quelle page ayant réussi à ouvrir cette fenêtre.
   *
   * Si la fenêtre parente a disparu — onglet fermé, ouverture détournée — on
   * bascule sur la navigation classique plutôt que de laisser une page morte.
   */
  private pageFenetre(charge: Record<string, string>, urlRepli: string): string {
    const origine = new URL(this.acab.retourPartenaires).origin;
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Connexion ACAB</title>
<style>body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#08080a;color:#8e8e99;font-size:14px}</style>
</head><body><p>Connexion en cours…</p><script>
(function(){
  var charge = ${AcabController.pourScript({ canal: CANAL, ...charge })};
  var origine = ${AcabController.pourScript(origine)};
  var repli = ${AcabController.pourScript(urlRepli)};
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(charge, origine);
      window.close();
      return;
    }
  } catch (e) {}
  window.location.replace(repli);
})();
</script></body></html>`;
  }

  /** Renvoie le navigateur vers l'espace partenaires, verdict en fragment. */
  private urlRetour(fragment: string): string {
    return `${this.acab.retourPartenaires}/auth/retour#${fragment}`;
  }

  private rendre(res: Response, fenetre: boolean, charge: Record<string, string>): void {
    AcabController.poserNonce(res, '', 0); // le nonce a servi, on le retire
    const fragment = new URLSearchParams(charge).toString();
    if (fenetre) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // Une page qui manipule un jeton n'a rien à faire dans un cache.
      res.setHeader('Cache-Control', 'no-store');
      res.send(this.pageFenetre(charge, this.urlRetour(fragment)));
      return;
    }
    res.redirect(302, this.urlRetour(fragment));
  }

  // ── Étape 1 ──────────────────────────────────────────────────────────────

  @Get('start')
  demarrer(@Res() res: Response, @Query('mode') mode?: string): void {
    if (!this.acab.estConfigure()) {
      throw new ServiceUnavailableException("La connexion ACAB n'est pas configurée.");
    }
    const { url, nonce } = this.acab.demarrer(mode === 'fenetre' || mode === 'popup');
    AcabController.poserNonce(res, nonce, COOKIE_MAX_AGE_S);
    res.redirect(302, url);
  }

  // ── Étape 2 : retour de l'ACAB ───────────────────────────────────────────

  @Get('callback')
  async retour(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ): Promise<void> {
    const nonce = AcabController.lireCookie(req, COOKIE_NONCE);

    // Le state se vérifie avant toute autre chose, y compris avant de lire un
    // éventuel « error » : sans ça, un tiers pourrait provoquer des retours
    // arbitraires sur cette route.
    const { valide, fenetre } = this.acab.verifierState(state, nonce);
    if (!valide) {
      return this.rendre(res, false, { erreur: 'echange_impossible' });
    }
    if (error || !code) {
      return this.rendre(res, fenetre, { erreur: 'acces_refuse' as AcabRefusal });
    }

    const issue = await this.acab.terminer(code);
    if (!issue.ok) {
      return this.rendre(res, fenetre, { erreur: issue.reason });
    }

    // En pleine page le jeton passe par le FRAGMENT (#) et non par la query :
    // un fragment n'est ni envoyé au serveur ni recopié dans le Referer. En
    // fenêtre il ne transite que par postMessage, sans jamais toucher l'URL.
    this.rendre(res, fenetre, { token: issue.token, courtier: issue.broker.name });
  }
}
