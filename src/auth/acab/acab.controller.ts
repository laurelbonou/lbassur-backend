import { Controller, Get, Query, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AcabService, type AcabRefusal } from './acab.service';

/**
 * Parcours « Se connecter avec ACAB ».
 *
 * Les deux routes sont des navigations de navigateur, pas des appels d'API :
 * elles répondent par des redirections 302 et jamais par du JSON. C'est aussi
 * pour ça que CORS ne les concerne pas.
 *
 * Le `client_secret` ne sort jamais d'ici : l'échange du code se fait de
 * serveur à serveur dans AcabService, sans que le navigateur en voie la trace.
 */

/** Nonce anti-CSRF, déposé à l'aller et relu au retour. */
const COOKIE_NONCE = 'acab_nonce';
const COOKIE_PATH = '/api/v1/auth/acab';
const COOKIE_MAX_AGE_S = 600;

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

  /** Renvoie le navigateur vers l'espace partenaires, verdict en fragment. */
  private redirigerVersEspace(res: Response, fragment: string): void {
    res.redirect(302, `${this.acab.retourPartenaires}/auth/retour#${fragment}`);
  }

  private echouer(res: Response, raison: AcabRefusal): void {
    AcabController.poserNonce(res, '', 0); // le nonce a servi, on le retire
    this.redirigerVersEspace(res, `erreur=${raison}`);
  }

  // ── Étape 1 ──────────────────────────────────────────────────────────────

  @Get('start')
  demarrer(@Res() res: Response): void {
    if (!this.acab.estConfigure()) {
      throw new ServiceUnavailableException("La connexion ACAB n'est pas configurée.");
    }
    const { url, nonce } = this.acab.demarrer();
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
    if (!this.acab.verifierState(state, nonce)) {
      return this.echouer(res, 'echange_impossible');
    }
    if (error || !code) {
      return this.echouer(res, 'acces_refuse');
    }

    const issue = await this.acab.terminer(code);
    if (!issue.ok) {
      return this.echouer(res, issue.reason);
    }

    AcabController.poserNonce(res, '', 0);

    // Le jeton passe par le fragment (#) et non par la query : un fragment
    // n'est jamais envoyé au serveur ni recopié dans l'en-tête Referer. À
    // charge de l'espace partenaires de le retirer de l'URL dès sa lecture.
    const params = new URLSearchParams({
      token: issue.token,
      courtier: issue.broker.name,
    });
    this.redirigerVersEspace(res, params.toString());
  }
}
