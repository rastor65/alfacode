import { applyDecorators } from "@nestjs/common";
import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

import { INSTITUTIONAL_ROLES } from "../modules/roles/role.entity";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

/** Longitud minima 12 y maxima 128 para contrasenas nuevas (NIST SP 800-63B / OWASP). */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const IsEmailField = () => applyDecorators(trim, IsString(), MaxLength(254), IsEmail());

export const IsNewPassword = () =>
  applyDecorators(IsString(), MinLength(PASSWORD_MIN_LENGTH), MaxLength(PASSWORD_MAX_LENGTH));

export const IsFullName = () => applyDecorators(trim, IsString(), MinLength(2), MaxLength(160));

/** Tokens emitidos por `generateSecureToken` (32 bytes en base64url). */
export const IsSecureToken = () => applyDecorators(IsString(), Matches(/^[A-Za-z0-9_-]{43}$/));

export const IsRoleCode = () => applyDecorators(IsString(), IsIn(INSTITUTIONAL_ROLES.map((role) => role.code)));

export const IsOptionalText = (max: number) => applyDecorators(trim, IsOptional(), IsString(), MaxLength(max));
