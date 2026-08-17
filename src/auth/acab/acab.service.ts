import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, timingSafeEqual } from 'crypto';
import { IntermediaryType, Prisma, type Broker } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * « Se connecter avec ACAB » — client OAuth 2.0 (flux authorization code).
 *
 * L'ACAB atteste qu'un cabinet est bien adhérent et nous renvoie son numéro
 * d'identification, sa dénomination et son statut. Elle ne transmet jamais
 * d'email ni de téléphone : leur annuaire ne doit pas devenir un fichier de
 * prospection. Rien ici ne doit chercher à contourner ça.
 */

/**
 * Ce que l'ACAB renvoie sur POST /oauth/token — rien de plus.
 *
 * Ni email ni téléphone n'y figurent, et ce n'est pas un oubli de leur part :
 * leur annuaire ne doit pas devenir un fichier de prospection. Ne rien ajouter
 * ici qui supposerait le contraire.
 */
export interface AcabMember {
  acabNumber: string;
  displayName: string;
  type: string;
  /** Liste close garantie par l'ACAB : ACTIVE | SUSPENDED | RADIE. */
  status: string;
}

/** Issue du parcours, telle qu'elle sera rendue au navigateur. */
export type AcabOutcome =
  | { ok: true; token: string; broker: Broker }
  | { ok: false; reason: AcabRefusal };

/**
 * Motifs de refus. Volontairement peu nombreux et non techniques : ils
 * traversent l'URL de retour et sont donc visibles du courtier.
 */
export type AcabRefusal =
  | 'acces_refuse' // le courtier a refusé le partage côté ACAB
  | 'echange_impossible' // code invalide, expiré, ou ACAB injoignable
  | 'adhesion_inactive' // adhérent suspendu ou radié
  | 'compte_en_attente'; // reconnu par l'ACAB, pas encore validé par LBASSUR

/** Format imposé par l'ACAB : 6 chiffres, « -ACAB- », 6 chiffres. */
const ACAB_NUMBER_RE = /^\d{6}-ACAB-\d{6}$/;

const DUREE_STATE = '10m';

/** Plafond de l'échange serveur à serveur avec l'ACAB. */
const TIMEOUT_ECHANGE_MS = 30_000;

@Injectable()
export class AcabService {
  private readonly logger = new Logger(AcabService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ── Configuration ────────────────────────────────────────────────────────

  private get baseUrl(): string {
    return (process.env.ACAB_BASE_URL || 'https://acab-backend.onrender.com').replace(/\/+$/, '');
  }

  /**
   * Doit correspondre au caractère près à l'URI enregistrée côté ACAB, à
   * l'aller comme au retour : la comparaison y est stricte, sans normalisation.
   */
  get redirectUri(): string {
    const uri = process.env.ACAB_REDIRECT_URI;
    if (!uri) throw new Error('ACAB_REDIRECT_URI manquante');
    return uri;
  }

  /** Où renvoyer le navigateur du courtier une fois le parcours terminé. */
  get retourPartenaires(): string {
    return (process.env.ESPACE_PARTENAIRES_URL || 'http://localhost:3002').replace(/\/+$/, '');
  }

  private credentials(): { id: string; secret: string } {
    const id = process.env.ACAB_CLIENT_ID;
    const secret = process.env.ACAB_CLIENT_SECRET;
    if (!id || !secret) throw new Error('ACAB_CLIENT_ID / ACAB_CLIENT_SECRET manquants');
    return { id, secret };
  }

  estConfigure(): boolean {
    return Boolean(
      process.env.ACAB_CLIENT_ID && process.env.ACAB_CLIENT_SECRET && process.env.ACAB_REDIRECT_URI,
    );
  }

  // ── Étape 1 : départ vers l'ACAB ─────────────────────────────────────────

  /**
   * Le « state » est signé plutôt que stocké : le backend peut redémarrer
   * entre l'aller et le retour sans casser le parcours. La protection CSRF
   * ne vient pas de la signature seule — n'importe qui peut faire émettre un
   * state valide — mais du nonce déposé en cookie et revérifié au retour.
   */
  demarrer(): { url: string; nonce: string } {
    const { id } = this.credentials();
    const nonce = randomBytes(32).toString('hex');
    const state = this.jwt.sign({ n: nonce }, { expiresIn: DUREE_STATE });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: id,
      redirect_uri: this.redirectUri,
      state,
    });

    return { url: `${this.baseUrl}/oauth/authorize?${params}`, nonce };
  }

  /** Le state du retour doit porter exactement le nonce du cookie d'aller. */
  verifierState(state: string | undefined, nonceCookie: string | undefined): boolean {
    if (!state || !nonceCookie) return false;
    try {
      const { n } = this.jwt.verify<{ n?: string }>(state);
      if (!n) return false;
      const a = Buffer.from(n);
      const b = Buffer.from(nonceCookie);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  // ── Étape 2 : échange du code, serveur à serveur ─────────────────────────

  private async echangerCode(code: string): Promise<AcabMember | null> {
    const { id, secret } = this.credentials();
    const basic = Buffer.from(`${id}:${secret}`).toString('base64');

    let reponse: Response;
    try {
      reponse = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basic}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
        // fetch() n'impose aucun délai par défaut : sans cette limite, un
        // service ACAB qui accepte la connexion sans jamais répondre
        // retiendrait la requête du courtier indéfiniment. 30 s est large —
        // l'étape d'autorisation a déjà réveillé leur instance Render, dont
        // le démarrage à froid mesuré tourne autour de 14 s.
        signal: AbortSignal.timeout(TIMEOUT_ECHANGE_MS),
      });
    } catch (err) {
      // Le service ACAB est hébergé sur Render : une première requête après
      // mise en veille peut expirer. On échoue proprement plutôt que de
      // laisser remonter une erreur réseau brute.
      this.logger.error(`ACAB injoignable : ${(err as Error).message}`);
      return null;
    }

    if (!reponse.ok) {
      // Le corps d'erreur de l'ACAB est générique par conception ; on le
      // journalise sans jamais le renvoyer au navigateur.
      const detail = await reponse.text().catch(() => '');
      this.logger.warn(`Échange refusé par l'ACAB (HTTP ${reponse.status}) : ${detail.slice(0, 200)}`);
      return null;
    }

    const data = (await reponse.json().catch(() => null)) as { member?: AcabMember } | null;
    const member = data?.member;
    if (!member?.acabNumber || !ACAB_NUMBER_RE.test(member.acabNumber)) {
      this.logger.warn("Réponse ACAB inexploitable : numéro d'adhérent absent ou malformé");
      return null;
    }
    return member;
  }

  // ── Étape 3 : rapprochement avec notre annuaire ──────────────────────────

  /**
   * Réduit une dénomination à sa forme comparable : accents retirés, casse et
   * ponctuation neutralisées. « ASCOMA Bénin » et « Ascoma  BENIN. » se
   * rejoignent, sans quoi le rapprochement échouerait sur des détails
   * typographiques entre notre liste ministérielle et l'annuaire ACAB.
   */
  private static normaliser(nom: string): string {
    return nom
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, ' ')
      .trim();
  }

  private async slugDisponible(base: string): Promise<string> {
    const racine =
      AcabService.normaliser(base).toLowerCase().replace(/ /g, '-').slice(0, 40) || 'courtier';
    for (let i = 0; i < 50; i++) {
      const candidat = i === 0 ? racine : `${racine}-${i}`;
      const pris = await this.prisma.broker.findUnique({
        where: { slug: candidat },
        select: { id: true },
      });
      if (!pris) return candidat;
    }
    return `${racine}-${randomBytes(4).toString('hex')}`;
  }

  private donneesAcab(member: AcabMember): Prisma.BrokerUpdateInput {
    return {
      acabStatus: member.status,
      acabSyncedAt: new Date(),
    };
  }

  /**
   * Trois cas, dans cet ordre :
   *
   *  1. déjà rattaché — on retrouve le cabinet par son numéro d'adhérent ;
   *  2. rattachable — un seul courtier de notre liste porte cette dénomination
   *     et n'est encore lié à personne : on l'associe ;
   *  3. inconnu — on crée la fiche *inactive*. L'ACAB atteste de l'adhésion,
   *     pas de la relation commerciale avec LBASSUR : c'est un administrateur
   *     qui l'ouvre, après avoir fixé le taux de commission. Créer un compte
   *     actif sans taux négocié reviendrait à promettre une rémunération non
   *     convenue.
   */
  private async rapprocher(member: AcabMember): Promise<Broker> {
    const existant = await this.prisma.broker.findUnique({
      where: { acabNumber: member.acabNumber },
    });
    if (existant) {
      return this.prisma.broker.update({
        where: { id: existant.id },
        data: this.donneesAcab(member),
      });
    }

    const orphelins = await this.prisma.broker.findMany({
      where: { type: IntermediaryType.COURTIER, acabNumber: null },
      select: { id: true, name: true },
    });
    const cible = AcabService.normaliser(member.displayName);
    const candidats = orphelins.filter((b) => AcabService.normaliser(b.name) === cible);

    if (candidats.length === 1) {
      this.logger.log(`Rattachement ACAB : « ${candidats[0].name} » ← ${member.acabNumber}`);
      return this.prisma.broker.update({
        where: { id: candidats[0].id },
        data: { acabNumber: member.acabNumber, ...this.donneesAcab(member) },
      });
    }

    // Zéro correspondance, ou plusieurs homonymes qu'on ne saurait départager
    // sans risquer d'ouvrir à un cabinet le portefeuille d'un autre.
    this.logger.log(
      `Nouveau cabinet ACAB en attente : « ${member.displayName} » (${member.acabNumber}), ` +
        `${candidats.length} homonyme(s) dans notre liste`,
    );
    return this.prisma.broker.create({
      data: {
        name: member.displayName,
        slug: await this.slugDisponible(member.displayName),
        type: IntermediaryType.COURTIER,
        acabNumber: member.acabNumber,
        acabStatus: member.status,
        acabSyncedAt: new Date(),
        active: false,
      },
    });
  }

  // ── Parcours complet ─────────────────────────────────────────────────────

  async terminer(code: string): Promise<AcabOutcome> {
    const member = await this.echangerCode(code);
    if (!member) return { ok: false, reason: 'echange_impossible' };

    // Un adhérent suspendu ou radié reste identifiable par l'ACAB, mais n'a
    // plus à accéder à un portefeuille.
    if (member.status !== 'ACTIVE') {
      this.logger.warn(`Adhésion non active refusée : ${member.acabNumber} (${member.status})`);
      return { ok: false, reason: 'adhesion_inactive' };
    }

    const broker = await this.rapprocher(member);
    if (!broker.active) return { ok: false, reason: 'compte_en_attente' };

    const token = this.jwt.sign({
      sub: broker.id,
      role: 'BROKER',
      acabNumber: broker.acabNumber,
    });
    return { ok: true, token, broker };
  }
}
