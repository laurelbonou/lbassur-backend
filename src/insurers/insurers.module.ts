import { Module } from "@nestjs/common";
import { InsurersController } from "./insurers.controller";
import { InsurersService } from "./insurers.service";

@Module({
  controllers: [InsurersController],
  providers: [InsurersService],
})
export class InsurersModule {}
