import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ApiError } from "../../common/api-error";
import { isMutatingMethod } from "../../common/origin.guard";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import type { RoleCode } from "../roles/role.entity";
import {
  ALLOW_PENDING_PASSWORD_CHANGE_KEY,
  type AuthenticatedRequest,
  IS_PUBLIC_KEY,
  REQUIRED_ROLES_KEY,
} from "./auth.decorators";
import { CSRF_HEADER, readCookie } from "./session-cookies";
import { SessionsService } from "./sessions.service";

/**
 * Guard global: toda ruta exige sesion valida salvo `@Public()`. En operaciones mutables
 * exige ademas el token CSRF ligado a la sesion, y aplica `@RequireRoles()` si existe.
 * El estado del usuario se lee de la base de datos en cada peticion.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(SessionsService)
    private readonly sessions: SessionsService,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (context.getType() !== "http") {
      return true;
    }

    const targets = [context.getHandler(), context.getClass()];

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readCookie(request, this.config.sessionCookieName);
    const session = token ? await this.sessions.findValid(token) : null;

    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Se requiere una sesion valida");
    }

    if (isMutatingMethod(request.method) && !this.sessions.matchesCsrfToken(session, request.header(CSRF_HEADER))) {
      throw new ApiError(403, "CSRF_TOKEN_INVALID", "Token CSRF ausente o invalido");
    }

    if (
      session.user.mustChangePassword &&
      !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_CHANGE_KEY, targets)
    ) {
      throw new ApiError(403, "PASSWORD_CHANGE_REQUIRED", "Debes cambiar tu contrasena temporal antes de continuar");
    }

    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[] | undefined>(REQUIRED_ROLES_KEY, targets);

    if (requiredRoles?.length) {
      const userRoles = new Set(session.user.roles.map((role) => role.code));

      if (!requiredRoles.some((role) => userRoles.has(role))) {
        throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta operacion");
      }
    }

    request.auth = { session, user: session.user };

    return true;
  }
}
