import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import * as compression from "compression";
import { v4 as uuidv4 } from "uuid";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Use Pino logger
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);
  
  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));
  app.use(compression());
  
  // Correlation ID middleware
  app.use((req: any, res: any, next: any) => {
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });

  const frontendUrls = process.env.FRONTEND_URL?.split(",").map((url) => url.trim()).filter(Boolean);
  const isProduction = process.env.NODE_ENV === "production";

  app.setGlobalPrefix("api/v1");

  if (!frontendUrls?.length && isProduction) {
    pinoLogger.error("FRONTEND_URL is not set — CORS will reject all origins in production!");
  } else if (!frontendUrls?.length) {
    pinoLogger.warn("FRONTEND_URL is not set — CORS is open to all origins (dev mode only).");
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

  app.useGlobalFilters(new GlobalExceptionFilter(pinoLogger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LBASSUR API")
    .setDescription("Insurance comparator backend API")
    .setVersion("1.0.0")
    .addApiKey({ type: "apiKey", name: "x-api-key", in: "header" }, "api-key")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  pinoLogger.log(`API running on port ${port}`);
  pinoLogger.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
