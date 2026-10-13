import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GlobalRateLimitGuard } from "../../common/global-rate-limit.guard";
import { OriginGuard } from "../../common/origin.guard";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordResetService } from "./password-reset.service";
import { RegistrationService } from "./registration.service";
import { SessionCleanupService } from "./session-cleanup.service";
import { Session } from "./session.entity";
import { SessionGuard } from "./session.guard";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [TypeOrmModule.forFeature([Session]), UsersModule],
  controllers: [AuthController],
  providers: [
    SessionsService,
    AuthService,
    RegistrationService,
    PasswordResetService,
    SessionCleanupService,
    // Guards globales, en este orden: origen, limite por IP, sesion/CSRF/roles.
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: GlobalRateLimitGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [SessionsService],
})
export class AuthModule {}
