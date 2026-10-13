import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

import { IsFullName, IsOptionalText, IsRoleCode } from "../../../common/validation";
import { INSTITUTIONAL_ROLES, type RoleCode } from "../../roles/role.entity";
import { ACCOUNT_STATUSES, type AccountStatus } from "../user.entity";

const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

/** F1-12: solo los datos editables por la propia persona. Rol, estado y verificacion no. */
export class UpdateProfileDto {
  @IsFullName()
  fullName!: string;
}

export class ListUsersQuery {
  /** Busca por nombre (y por correo, solo para autoridades). */
  @trim
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Solo autoridades pueden consultar integrantes que no esten activos. */
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  status?: AccountStatus;

  @IsOptional()
  @IsIn(INSTITUTIONAL_ROLES.map((role) => role.code))
  role?: RoleCode;

  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export const MANAGEABLE_STATUSES = ["active", "inactive"] as const;

export class UpdateUserStatusDto {
  @IsIn(MANAGEABLE_STATUSES)
  status!: (typeof MANAGEABLE_STATUSES)[number];

  @IsOptionalText(500)
  reason?: string;

  /** Obligatorio al activar a una persona que no tiene ningun rol (p. ej. una solicitud rechazada). */
  @IsOptional()
  @IsRoleCode()
  roleCode?: RoleCode;
}

export class AssignRoleDto {
  @IsRoleCode()
  roleCode!: RoleCode;
}
