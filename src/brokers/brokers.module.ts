import { Module } from "@nestjs/common";
import { BrokersController } from "./brokers.controller";
import { BrokersService } from "./brokers.service";
import { BrokerPortalController } from "./broker-portal.controller";
import { BrokerPortalService } from "./broker-portal.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [BrokersController, BrokerPortalController],
  providers: [BrokersService, BrokerPortalService],
  exports: [BrokersService],
})
export class BrokersModule {}
