import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { Logger } from 'nestjs-pino';

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

    const signature = request.headers['x-feexpay-signature'];
    const timestamp = request.headers['x-feexpay-timestamp'];
    const nonce = request.headers['x-feexpay-nonce'];

    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    // Protect against replay attacks (e.g. timestamp > 5 mins old)
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - requestTime) > 300) {
        throw new UnauthorizedException('Request expired (Replay protection)');
      }
    }

    // Compute HMAC SHA256
    // Note: In a real scenario, the raw body buffer should be used. 
    // Here we stringify the parsed body as a fallback.
    const payload = JSON.stringify(request.body);
    const dataToSign = timestamp && nonce ? `${timestamp}.${nonce}.${payload}` : payload;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToSign)
      .digest('hex');

    if (signature !== expectedSignature) {
      this.logger.error({ expectedSignature, signature }, 'Invalid FeexPay webhook signature');
      throw new UnauthorizedException('Invalid signature');
    }

    return true;
  }
}
