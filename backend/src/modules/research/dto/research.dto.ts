import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
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
import {
  RESEARCH_LINE_STATUSES,
  RESEARCH_RESULT_TYPES,
  type ResearchLineStatus,
  type ResearchResultType,
} from "../research.entities";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
/** Fecha de calendario `YYYY-MM-DD`; la validez real se comprueba en el servicio. */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** `null` borra el campo; `undefined` lo deja igual. */
const nullable = ValidateIf((_object, value) => value !== null);

export class CreateResearchLineDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name!: string;

  @IsOptionalText(5000)
  description?: string;

  @IsOptionalText(5000)
  objectives?: string;

  @IsOptional()
  @IsUUID("4")
  responsibleUserId?: string;
}

export class UpdateResearchLineDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name?: string;

  @nullable
  @IsOptionalText(5000)
  description?: string | null;

  @nullable
  @IsOptionalText(5000)
  objectives?: string | null;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID("4")
  responsibleUserId?: string | null;

  @IsOptional()
  @IsIn(RESEARCH_LINE_STATUSES)
  status?: ResearchLineStatus;
}

export class ListResearchLinesQuery {
  @trim
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(RESEARCH_LINE_STATUSES)
  status?: ResearchLineStatus;

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

export class LinkResearchLineDto {
  @IsUUID("4")
  researchLineId!: string;
}

/** Ficha investigativa completa (PUT): los campos ausentes o vacios quedan sin valor. */
export class SaveResearchProfileDto {
  @IsOptionalText(10000)
  problem?: string;

  @IsOptionalText(2000)
  question?: string;

  @IsOptionalText(10000)
  justification?: string;

  @IsOptionalText(10000)
  methodology?: string;

  @IsOptionalText(10000)
  notes?: string;
}

/** `projectId` no se acepta: el proyecto sale de la URL. */
export class CreateResearchResultDto {
  @trim
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsOptionalText(10000)
  description?: string;

  @IsOptional()
  @IsIn(RESEARCH_RESULT_TYPES)
  type?: ResearchResultType;

  @IsOptional()
  @Matches(CALENDAR_DATE)
  resultDate?: string;

  @IsOptionalText(5000)
  references?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  participantIds?: string[];
}

/** Cambios parciales; `participantIds` reemplaza la lista completa. */
export class UpdateResearchResultDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @nullable
  @IsOptionalText(10000)
  description?: string | null;

  @IsOptional()
  @IsIn(RESEARCH_RESULT_TYPES)
  type?: ResearchResultType;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @Matches(CALENDAR_DATE)
  resultDate?: string | null;

  @nullable
  @IsOptionalText(5000)
  references?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  participantIds?: string[];
}
