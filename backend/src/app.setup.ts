import type { NestExpressApplication } from "@nestjs/platform-express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";

import { SECURITY_CONFIG, type SecurityConfig } from "./common/security.config";

/** Configuracion HTTP comun a `main.ts` y a las pruebas de integracion. */
export function configureApp(app: NestExpressApplication) {
  const config = app.get<SecurityConfig>(SECURITY_CONFIG);

  app.setGlobalPrefix("api/v1");
  app.set("trust proxy", config.trustProxy);
  app.useBodyParser("json", { limit: "100kb" });
  app.use(helmet());
  // Ninguna respuesta de la API se guarda en caches (sesion, datos personales, contrasenas temporales).
  app.use("/api/v1", (_request: Request, response: Response, next: NextFunction) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  // Nunca CORS con "*" cuando se usan cookies: solo origenes configurados.
  app.enableCors({
    origin: config.allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  });
  app.enableShutdownHooks();

  return app;
}
