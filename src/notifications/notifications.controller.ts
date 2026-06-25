import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

class SendCustomEmailDto {
  to: string;
  subject: string;
  message: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-custom-email')
  @UseGuards(ApiKeyGuard) // Protected route for admin only
  async sendCustomEmail(@Body() dto: SendCustomEmailDto) {
    if (!dto.to || !dto.subject || !dto.message) {
      throw new BadRequestException('Destinataire, objet et message sont requis');
    }

    await this.notificationsService.sendEmail(dto.to, dto.subject, dto.message);

    return { success: true, message: 'Email envoyé avec succès' };
  }
}
