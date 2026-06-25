import "dotenv/config";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  const logger = new Logger("Bootstrap");

  const frontendUrls = process.env.FRONTEND_URL?.split(",").map((url) => url.trim()).filter(Boolean);
  const isProduction = process.env.NODE_ENV === "production";

  app.setGlobalPrefix("api");

  if (!frontendUrls?.length && isProduction) {
    logger.error("FRONTEND_URL is not set — CORS will reject all origins in production!");
  } else if (!frontendUrls?.length) {
    logger.warn("FRONTEND_URL is not set — CORS is open to all origins (dev mode only).");
  }

  app.enableCors({
    origin: frontendUrls?.length ? frontendUrls : (isProduction ? false : true),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LBASSUR API")
    .setDescription("Insurance comparator backend API")
    .setVersion("0.1.0")
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "api-key")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  logger.log(`API running on port ${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
