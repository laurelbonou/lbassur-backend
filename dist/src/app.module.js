"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const env_validation_1 = require("./config/env.validation");
const health_module_1 = require("./health/health.module");
const insurers_module_1 = require("./insurers/insurers.module");
const offers_module_1 = require("./offers/offers.module");
const payments_module_1 = require("./payments/payments.module");
const prisma_module_1 = require("./prisma/prisma.module");
const quote_requests_module_1 = require("./quote-requests/quote-requests.module");
const simulations_module_1 = require("./simulations/simulations.module");
const tariffs_module_1 = require("./tariffs/tariffs.module");
const uploads_module_1 = require("./uploads/uploads.module");
const notifications_module_1 = require("./notifications/notifications.module");
const documents_module_1 = require("./documents/documents.module");
const auth_module_1 = require("./auth/auth.module");
const clients_module_1 = require("./clients/clients.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.envValidationSchema,
                validationOptions: {
                    abortEarly: true,
                },
            }),
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    transport: process.env.NODE_ENV !== 'production'
                        ? { target: 'pino-pretty', options: { colorize: true } }
                        : undefined,
                },
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            insurers_module_1.InsurersModule,
            offers_module_1.OffersModule,
            tariffs_module_1.TariffsModule,
            simulations_module_1.SimulationsModule,
            quote_requests_module_1.QuoteRequestsModule,
            uploads_module_1.UploadsModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            documents_module_1.DocumentsModule,
            auth_module_1.AuthModule,
            clients_module_1.ClientsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map