import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';

/**
 * Authentifie les webhooks de paiement FeexPay.
 *
 * FeexPay ne signe pas le corps des requêtes : sa console propose uniquement un
 * en-tête `Authorization` fixe, en `Bearer` ou `Basic`, dont on choisit soi-même
 * la valeur. Le contrôle se réduit donc à comparer ce jeton partagé.
 *
 * Conséquence à connaître : contrairement à une signature HMAC, ce mécanisme ne
 * prouve pas que le corps est intact et n'empêche pas le rejeu. Quiconque obtient
 * le jeton peut fabriquer une confirmation de paiement. La parade robuste est de
 * confirmer chaque transaction auprès de l'API FeexPay avant de la marquer payée,
 * plutôt que de faire confiance au corps reçu.
 */
@Injectable()
export class FeexPayWebhookGuard implements CanActivate {
  constructor(private readonly logger: Logger) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = process.env.FEEXPAY_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.warn('FEEXPAY_WEBHOOK_SECRET is not configured. Webhook validation is bypassed.');
      return true; // Bypass if not configured, though in prod it should be enforced by env.validation
    }

    const header: string | undefined = request.headers['authorization'];
    if (!header) {
      throw new UnauthorizedException('Missing authorization header');
    }

    // FeexPay envoie « Bearer <valeur> » ou « Basic <valeur> » selon le type
    // choisi dans sa console. On accepte les deux et on ne compare que la valeur.
    const token = header.replace(/^(Bearer|Basic)\s+/i, '').trim();

    if (!this.matches(token, secret)) {
      this.logger.error('Invalid FeexPay webhook token');
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  /**
   * Comparaison à temps constant : une comparaison `!==` classique s'arrête au
   * premier octet différent, ce qui laisse deviner le jeton attendu octet par
   * octet en mesurant le temps de réponse.
   */
  private matches(received: string, expected: string): boolean {
    const a = Buffer.from(received, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
