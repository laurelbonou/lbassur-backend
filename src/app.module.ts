import { Module } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { HealthModule } from "./health/health.module";
import { InsurersModule } from "./insurers/insurers.module";
import { OffersModule } from "./offers/offers.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";
import { SimulationsModule } from "./simulations/simulations.module";
import { TariffsModule } from "./tariffs/tariffs.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "uploads"),
      serveRoot: "/uploads",
    }),
    PrismaModule,
    HealthModule,
    InsurersModule,
    OffersModule,
    TariffsModule,
    SimulationsModule,
    QuoteRequestsModule,
    UploadsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
