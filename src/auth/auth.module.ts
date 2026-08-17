import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AcabService } from './acab/acab.service';
import { AcabController } from './acab/acab.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, AcabController],
  providers: [AuthService, AcabService],
})
export class AuthModule {}
