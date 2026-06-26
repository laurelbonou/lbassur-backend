"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
const nestjs_pino_1 = require("nestjs-pino");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const compression = require("compression");
const uuid_1 = require("uuid");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const pinoLogger = app.get(nestjs_pino_1.Logger);
    app.useLogger(pinoLogger);
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }));
    app.use(compression());
    app.use((req, res, next) => {
        const correlationId = req.headers['x-correlation-id'] || (0, uuid_1.v4)();
        req.headers['x-correlation-id'] = correlationId;
        res.setHeader('x-correlation-id', correlationId);
        next();
    });
    const frontendUrls = process.env.FRONTEND_URL?.split(",").map((url) => url.trim()).filter(Boolean);
    const isProduction = process.env.NODE_ENV === "production";
    app.setGlobalPrefix("api/v1");
    if (!frontendUrls?.length && isProduction) {
        pinoLogger.error("FRONTEND_URL is not set — CORS will reject all origins in production!");
    }
    else if (!frontendUrls?.length) {
        pinoLogger.warn("FRONTEND_URL is not set — CORS is open to all origins (dev mode only).");
    }
    app.enableCors({
        origin: frontendUrls?.length ? frontendUrls : (isProduction ? false : true),
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter(pinoLogger));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle("LBASSUR API")
        .setDescription("Insurance comparator backend API")
        .setVersion("1.0.0")
        .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "api-key")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup("docs", app, document);
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port, '0.0.0.0');
    pinoLogger.log(`API running on port ${port}`);
    pinoLogger.log(`Swagger docs at http://localhost:${port}/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map