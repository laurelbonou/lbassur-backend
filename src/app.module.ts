import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { InsurersModule } from "./insurers/insurers.module";
import { OffersModule } from "./offers/offers.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";
import { SimulationsModule } from "./simulations/simulations.module";
import { TariffsModule } from "./tariffs/tariffs.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    InsurersModule,
    OffersModule,
    TariffsModule,
    SimulationsModule,
    QuoteRequestsModule,
  ],
})
export class AppModule {}
