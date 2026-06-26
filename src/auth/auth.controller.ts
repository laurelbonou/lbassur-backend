import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 login attempts per minute
  login(@Body() body: { phone: string; password?: string }) {
    return this.authService.login(body.phone, body.password);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 registration attempts per minute
  register(@Body() body: { phone: string; password?: string; fullName?: string }) {
    return this.authService.register(body.phone, body.password, body.fullName);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new Error('refreshToken is required'); // Will be caught by GlobalExceptionFilter
    }
    return this.authService.refresh(body.refreshToken);
  }
}
