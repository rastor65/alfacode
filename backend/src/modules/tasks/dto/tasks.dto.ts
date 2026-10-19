import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

import { IsOptionalText } from "../../../common/validation";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "../task.entity";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
/** Fecha de calendario `YYYY-MM-DD`; la validez real se comprueba en el servicio. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `projectId` y `sprintId` no se aceptan: el proyecto sale de la URL y el sprint se gestiona desde sus rutas (F2-15). */
export class CreateTaskDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptionalText(5000)
  description?: string;

  @IsOptional()
  @IsUUID("4")
  assigneeId?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  dueDate?: string;
}

/** Cambios parciales; `null` borra descripcion, responsable o fecha limite. */
export class UpdateTaskDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ValidateIf((_object, value) => value !== null)
  @IsOptionalText(5000)
  description?: string | null;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID("4")
  assigneeId?: string | null;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @Matches(CALENDAR_DATE)
  dueDate?: string | null;
}

export class ListTasksQuery {
  @trim
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  /** UUID de la persona responsable, o `none` para las tareas sin responsable. */
  @IsOptional()
  @ValidateIf((_object, value) => value !== "none")
  @IsUUID("4")
  assigneeId?: string;

  /** UUID de un sprint del proyecto, o `none` para el backlog (`sprint_id IS NULL`, F2-10). */
  @IsOptional()
  @ValidateIf((_object, value) => value !== "none")
  @IsUUID("4")
  sprintId?: string;

  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  /** El tablero pide todas las tareas del proyecto de una vez (hasta 200). */
  @toInt
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
