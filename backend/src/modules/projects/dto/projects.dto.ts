import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

import { IsOptionalText } from "../../../common/validation";
import { PROJECT_ROLES, type ProjectRole } from "../project-member.entity";
import {
  PROJECT_METHODOLOGIES,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  type ProjectMethodology,
  type ProjectStatus,
  type ProjectType,
} from "../project.entity";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
/** Fecha de calendario `YYYY-MM-DD`; la validez real (p. ej. 2026-02-30) se comprueba en el servicio. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateProjectDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @IsOptionalText(5000)
  description?: string;

  @IsIn(PROJECT_TYPES)
  type!: ProjectType;

  @IsIn(PROJECT_METHODOLOGIES)
  methodology!: ProjectMethodology;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  startDate?: string;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  endDate?: string;

  /**
   * F2-03: quien crea queda como lider salvo que indique que no participa (p. ej. un
   * administrador tecnico); en ese caso debe asignar un lider antes de activar el proyecto.
   */
  @IsOptional()
  @IsBoolean()
  joinAsLeader?: boolean;
}

/** Edicion de datos generales. La metodologia y el estado tienen reglas propias. */
export class UpdateProjectDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  // `null` borra la descripcion o las fechas.
  @ValidateIf((_object, value) => value !== null)
  @IsOptionalText(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(PROJECT_TYPES)
  type?: ProjectType;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @Matches(CALENDAR_DATE)
  startDate?: string | null;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @Matches(CALENDAR_DATE)
  endDate?: string | null;
}

export class ChangeProjectStatusDto {
  @IsIn(PROJECT_STATUSES)
  status!: ProjectStatus;

  @IsOptionalText(500)
  reason?: string;
}

export class ListProjectsQuery {
  @trim
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: ProjectStatus;

  @IsOptional()
  @IsIn(PROJECT_METHODOLOGIES)
  methodology?: ProjectMethodology;

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

export class AddProjectMemberDto {
  @IsUUID("4")
  userId!: string;

  @IsIn(PROJECT_ROLES)
  role!: ProjectRole;
}

export class UpdateProjectMemberDto {
  @IsIn(PROJECT_ROLES)
  role!: ProjectRole;
}

/** F2-04: retirar a una persona con tareas abiertas exige pedir su desasignacion de forma explicita. */
export class RemoveProjectMemberQuery {
  @Transform(({ value }) => (value === "true" ? true : value === "false" ? false : value))
  @IsOptional()
  @IsBoolean()
  unassignTasks?: boolean;
}
