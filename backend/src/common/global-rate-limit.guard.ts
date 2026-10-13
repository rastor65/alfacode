import { type CanActivate, type ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { RateLimiterService } from "./rate-limiter.service";

/** Limite general por IP para toda la API; las rutas sensibles agregan limites propios. */
export const GLOBAL_RATE_LIMIT = { limit: 300, windowMs: 60 * 1000 };

@Injectable()
export class GlobalRateLimitGuard implements CanActivate {
  constructor(
    @Inject(RateLimiterService)
    private readonly rateLimiter: RateLimiterService,
  ) {}

  canActivate(context: ExecutionContext) {
    if (context.getType() !== "http") {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    this.rateLimiter.consume(`global:${request.ip ?? "unknown"}`, GLOBAL_RATE_LIMIT.limit, GLOBAL_RATE_LIMIT.windowMs);

    return true;
  }
}
