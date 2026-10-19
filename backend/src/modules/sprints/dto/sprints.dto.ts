import { Transform } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

import { IsOptionalText } from "../../../common/validation";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
/** Fecha de calendario `YYYY-MM-DD`; la validez real se comprueba en el servicio. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateSprintDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @IsOptionalText(2000)
  goal?: string;

  @Matches(CALENDAR_DATE)
  startDate!: string;

  @Matches(CALENDAR_DATE)
  endDate!: string;
}

/** Solo sprints planificados; `goal: null` borra el objetivo. */
export class UpdateSprintDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name?: string;

  @ValidateIf((_object, value) => value !== null)
  @IsOptionalText(2000)
  goal?: string | null;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  startDate?: string;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  endDate?: string;
}

export class AddSprintTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  taskIds!: string[];
}

/** F2-18: la cancelacion exige un motivo. */
export class CancelSprintDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
