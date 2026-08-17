import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Protège les routes de l'espace partenaires.
 *
 * Le backend signe plusieurs familles de jetons avec la même clé (CLIENT,
 * BROKER) : vérifier la signature ne dit donc pas *qui* appelle. Le contrôle
 * du rôle est ce qui empêche un jeton client d'ouvrir un portefeuille de
 * courtier, et inversement.
 *
 * Ce garde établit l'identité, pas les droits : chaque requête devra ensuite
 * être filtrée sur `req.broker.id`, faute de quoi un courtier verrait les
 * affaires de ses confrères.
 */
@Injectable()
export class BrokerAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { broker?: unknown }>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token manquant');
    }

    let payload: { sub?: string; role?: string; acabNumber?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
    } catch {
      throw new UnauthorizedException('Token invalide');
    }

    if (payload.role !== 'BROKER' || !payload.sub) {
      throw new UnauthorizedException('Token invalide');
    }

    request.broker = { id: payload.sub, acabNumber: payload.acabNumber };
    return true;
  }
}
