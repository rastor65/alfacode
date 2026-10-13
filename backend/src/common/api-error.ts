import { HttpException } from "@nestjs/common";

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown;
}

export class ApiError extends HttpException {
  constructor(status: number, code: string, message: string, details: unknown = null) {
    super({ code, message, details } satisfies ApiErrorBody, status);
  }
}

export class RateLimitExceededError extends ApiError {
  constructor(readonly retryAfterSeconds: number) {
    super(429, "TOO_MANY_REQUESTS", "Demasiadas solicitudes; intenta de nuevo mas tarde", {
      retryAfterSeconds,
    });
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiErrorBody).code === "string" &&
    typeof (value as ApiErrorBody).message === "string"
  );
}
