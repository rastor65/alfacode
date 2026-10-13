import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { ApiError } from "./api-error";
import { SECURITY_CONFIG, type SecurityConfig } from "./security.config";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isMutatingMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

function requestOrigin(request: Request) {
  const origin = request.header("origin");

  if (origin) {
    return origin;
  }

  const referer = request.header("referer");

  if (!referer) {
    return undefined;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/**
 * Exige que toda operacion mutable venga de un origen web autorizado (Origin, o Referer
 * como respaldo). Se aplica tambien a rutas publicas como el login (CSRF de inicio de sesion).
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  canActivate(context: ExecutionContext) {
    if (context.getType() !== "http") {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (!isMutatingMethod(request.method)) {
      return true;
    }

    const origin = requestOrigin(request);

    if (!origin || !this.config.allowedOrigins.includes(origin)) {
      throw new ApiError(403, "ORIGIN_NOT_ALLOWED", "Origen de la solicitud no autorizado");
    }

    return true;
  }
}
