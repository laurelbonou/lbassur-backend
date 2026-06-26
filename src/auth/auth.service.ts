import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(phone: string, password?: string) {
    const client = await this.prisma.client.findUnique({ where: { phone } });
    if (!client) {
      throw new UnauthorizedException('Numéro de téléphone ou mot de passe incorrect');
    }

    if (client.passwordHash) {
      if (!password) {
        throw new BadRequestException('Mot de passe requis');
      }
      const isMatch = await bcrypt.compare(password, client.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Numéro de téléphone ou mot de passe incorrect');
      }
    } else {
      // If no password set (oklm mode), we allow login via OTP in real life.
      // Here, if password is required to log into the portal, they must create an account.
      if (password) {
        throw new UnauthorizedException("Ce compte n'a pas de mot de passe. Veuillez vous inscrire.");
      }
      // For simplicity in this demo, if they don't provide a password and there's no hash, we let them in or require them to register.
      // Let's require registration to set a password.
      throw new UnauthorizedException("Ce compte n'a pas de mot de passe. Veuillez finaliser votre inscription.");
    }

    const payload = { sub: client.id, phone: client.phone, role: 'CLIENT' };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET as string,
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as any,
    });

    return {
      access_token,
      refresh_token,
      client: {
        id: client.id,
        phone: client.phone,
        fullName: client.fullName,
      }
    };
  }

  async register(phone: string, password?: string, fullName?: string) {
    let client = await this.prisma.client.findUnique({ where: { phone } });

    if (client && client.passwordHash) {
      throw new BadRequestException('Un compte existe déjà avec ce numéro de téléphone.');
    }

    let hash: string | undefined = undefined;
    if (password) {
      hash = await bcrypt.hash(password, 10);
    }

    if (client) {
      client = await this.prisma.client.update({
        where: { phone },
        data: { passwordHash: hash, fullName: fullName || client.fullName },
      });
    } else {
      client = await this.prisma.client.create({
        data: {
          phone,
          fullName,
          passwordHash: hash,
        },
      });
    }

    const payload = { sub: client.id, phone: client.phone, role: 'CLIENT' };
    const access_token = await this.jwtService.signAsync(payload);
    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET as string,
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as any,
    });

    return {
      access_token,
      refresh_token,
      client: {
        id: client.id,
        phone: client.phone,
        fullName: client.fullName,
      }
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET as string,
      });

      const client = await this.prisma.client.findUnique({ where: { id: payload.sub } });
      if (!client) {
        throw new UnauthorizedException('Client not found');
      }

      const newPayload = { sub: client.id, phone: client.phone, role: 'CLIENT' };
      const access_token = await this.jwtService.signAsync(newPayload);
      const refresh_token = await this.jwtService.signAsync(newPayload, {
        secret: process.env.REFRESH_TOKEN_SECRET as string,
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as any,
      });

      return {
        access_token,
        refresh_token,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
