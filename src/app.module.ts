import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { envValidationSchema } from "./config/env.validation";
import { HealthModule } from "./health/health.module";
import { InsurersModule } from "./insurers/insurers.module";
import { OffersModule } from "./offers/offers.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";
import { SimulationsModule } from "./simulations/simulations.module";
import { TariffsModule } from "./tariffs/tariffs.module";
import { UploadsModule } from "./uploads/uploads.module";
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute max globally
    }]),
    PrismaModule,
    HealthModule,
    InsurersModule,
    OffersModule,
    TariffsModule,
    SimulationsModule,
    QuoteRequestsModule,
    UploadsModule,
    PaymentsModule,
    NotificationsModule,
    DocumentsModule,
    AuthModule,
    ClientsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
