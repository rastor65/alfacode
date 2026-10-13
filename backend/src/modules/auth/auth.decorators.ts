import { type ExecutionContext, SetMetadata, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";

import type { RoleCode } from "../roles/role.entity";
import type { User } from "../users/user.entity";
import type { Session } from "./session.entity";

export const IS_PUBLIC_KEY = "auth:isPublic";
export const REQUIRED_ROLES_KEY = "auth:requiredRoles";
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = "auth:allowPendingPasswordChange";

/** Excluye la ruta de la exigencia de sesion. Las rutas son privadas por defecto. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Permite la ruta a quien todavia debe cambiar su contrasena temporal. Sin esta marca, el
 * guard bloquea cualquier otra ruta con 403 `PASSWORD_CHANGE_REQUIRED` (DEC-016).
 */
export const AllowPendingPasswordChange = () => SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);

/** Exige al menos uno de los roles institucionales indicados (union de permisos). */
export const RequireRoles = (...roles: RoleCode[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);

export interface AuthContext {
  session: Session;
  user: User;
}

export type AuthenticatedRequest = Request & { auth?: AuthContext };

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;

  if (!auth) {
    throw new Error("CurrentAuth used on a route without an authenticated session");
  }

  return auth;
});
