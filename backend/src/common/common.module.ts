import { Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";

import { PasswordService } from "../modules/auth/password.service";
import { ApiExceptionFilter } from "./api-exception.filter";
import { RateLimiterService } from "./rate-limiter.service";
import { SECURITY_CONFIG, loadSecurityConfig } from "./security.config";

@Global()
@Module({
  providers: [
    { provide: SECURITY_CONFIG, useFactory: loadSecurityConfig },
    RateLimiterService,
    // Sin dependencias; global para que auth, solicitudes e integrantes hasheen contrasenas.
    PasswordService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
  exports: [SECURITY_CONFIG, RateLimiterService, PasswordService],
})
export class CommonModule {}
