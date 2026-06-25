import { Module } from "@nestjs/common";
import { QuoteRequestsController } from "./quote-requests.controller";
import { QuoteRequestsService } from "./quote-requests.service";
import { PrismaModule } from "../prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, DocumentsModule, NotificationsModule],
  controllers: [QuoteRequestsController],
  providers: [QuoteRequestsService],
})
export class QuoteRequestsModule {}
