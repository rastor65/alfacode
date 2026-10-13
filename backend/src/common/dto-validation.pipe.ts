import type { PipeTransform } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { ApiError } from "./api-error";

/**
 * Valida el cuerpo contra una clase DTO recibida de forma explicita. No depende de
 * `design:paramtypes`, que `tsx` (esbuild) no emite: un ValidationPipe global se saltaria
 * la validacion en desarrollo sin avisar. Rechaza propiedades no declaradas.
 */
export class DtoValidationPipe<T extends object> implements PipeTransform<unknown, Promise<T>> {
  constructor(private readonly dto: new () => T) {}

  async transform(value: unknown): Promise<T> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ApiError(400, "VALIDATION_ERROR", "El cuerpo de la solicitud debe ser un objeto JSON");
    }

    const instance = plainToInstance(this.dto, value);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      // No se devuelven los valores recibidos (podrian contener contrasenas).
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "La solicitud contiene datos invalidos",
        errors.map((error) => ({ field: error.property, rules: Object.keys(error.constraints ?? {}) })),
      );
    }

    return instance;
  }
}
