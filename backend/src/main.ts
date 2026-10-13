import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";

async function bootstrap() {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  const config = app.get(ConfigService);
  const port = Number(config.get<string>("BACKEND_PORT") ?? process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
