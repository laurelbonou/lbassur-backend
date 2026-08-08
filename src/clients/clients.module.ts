import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
