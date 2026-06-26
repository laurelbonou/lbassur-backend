import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { phone: string; password?: string }) {
    return this.authService.login(body.phone, body.password);
  }

  @Post('register')
  register(@Body() body: { phone: string; password?: string; fullName?: string }) {
    return this.authService.register(body.phone, body.password, body.fullName);
  }
}
