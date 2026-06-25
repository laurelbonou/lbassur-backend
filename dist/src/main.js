"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    const logger = new common_1.Logger("Bootstrap");
    const frontendUrls = process.env.FRONTEND_URL?.split(",").map((url) => url.trim()).filter(Boolean);
    const isProduction = process.env.NODE_ENV === "production";
    app.setGlobalPrefix("api");
    if (!frontendUrls?.length && isProduction) {
        logger.error("FRONTEND_URL is not set — CORS will reject all origins in production!");
    }
    else if (!frontendUrls?.length) {
        logger.warn("FRONTEND_URL is not set — CORS is open to all origins (dev mode only).");
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
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle("LBASSUR API")
        .setDescription("Insurance comparator backend API")
        .setVersion("0.1.0")
        .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "api-key")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup("docs", app, document);
    const port = Number(process.env.PORT ?? 4000);
    await app.listen(port);
    logger.log(`API running on http://localhost:${port}`);
    logger.log(`Swagger docs at http://localhost:${port}/docs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map