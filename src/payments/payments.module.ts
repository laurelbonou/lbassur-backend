import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { BrokersModule } from "../brokers/brokers.module";

@Module({
  imports: [PrismaModule, DocumentsModule, NotificationsModule, BrokersModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
