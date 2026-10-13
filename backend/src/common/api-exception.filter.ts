import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import type { Response } from "express";

import { type ApiErrorBody, RateLimitExceededError, isApiErrorBody } from "./api-error";

const DEFAULT_ERRORS: Record<number, Omit<ApiErrorBody, "details">> = {
  400: { code: "BAD_REQUEST", message: "Solicitud invalida" },
  401: { code: "UNAUTHENTICATED", message: "Se requiere una sesion valida" },
  403: { code: "FORBIDDEN", message: "No tienes permiso para esta operacion" },
  404: { code: "NOT_FOUND", message: "Recurso no encontrado" },
  405: { code: "METHOD_NOT_ALLOWED", message: "Metodo no permitido" },
  409: { code: "CONFLICT", message: "Conflicto con el estado actual del recurso" },
  413: { code: "PAYLOAD_TOO_LARGE", message: "La solicitud es demasiado grande" },
  415: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Tipo de contenido no soportado" },
  422: { code: "UNPROCESSABLE_ENTITY", message: "La solicitud no cumple una regla de negocio" },
  429: { code: "TOO_MANY_REQUESTS", message: "Demasiadas solicitudes; intenta de nuevo mas tarde" },
  503: { code: "SERVICE_BUSY", message: "El servicio esta ocupado; intenta de nuevo en unos segundos" },
};

/**
 * Respuesta de error uniforme `{ code, message, details }`, sin trazas ni datos sensibles.
 * Los errores no controlados se registran en el servidor y se devuelven como 500 generico.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ApiExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof RateLimitExceededError) {
      response.setHeader("Retry-After", String(exception.retryAfterSeconds));
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (isApiErrorBody(body)) {
        response.status(status).json({ code: body.code, message: body.message, details: body.details ?? null });
        return;
      }

      const fallback = DEFAULT_ERRORS[status] ?? { code: "HTTP_ERROR", message: "Error en la solicitud" };
      response.status(status).json({ ...fallback, details: null });
      return;
    }

    // Errores del parser de cuerpo de Express (JSON mal formado, tamano excedido).
    const status = (exception as { status?: unknown; type?: unknown } | null)?.status;
    if (typeof status === "number" && status >= 400 && status < 500) {
      const fallback = DEFAULT_ERRORS[status] ?? DEFAULT_ERRORS[400];
      response.status(status).json({ ...fallback, details: null });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    response.status(500).json({ code: "INTERNAL_ERROR", message: "Error interno del servidor", details: null });
  }
}
