import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token manquant');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET as string,
      });
      // Plusieurs familles de jetons partagent la même clé de signature
      // (CLIENT, BROKER) : sans ce contrôle, ce garde laisserait un courtier
      // entrer sur une route destinée aux assurés. Pour l'espace partenaires,
      // utiliser BrokerAuthGuard.
      if (payload?.role !== 'CLIENT') {
        throw new UnauthorizedException('Token invalide');
      }
      // We attach the payload to the request object here
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
