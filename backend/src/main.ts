import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origins = parseOrigins(config.get<string>("CORS_ORIGINS"));

  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  const port = Number(config.get<string>("BACKEND_PORT") ?? process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
