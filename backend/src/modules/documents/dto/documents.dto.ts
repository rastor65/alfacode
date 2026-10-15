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
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

import { IsOptionalText } from "../../../common/validation";
import {
  ACCESS_LEVELS,
  type AccessLevel,
  DOCUMENT_CATEGORIES,
  DOCUMENT_SCOPES,
  type DocumentCategory,
  type DocumentScope,
} from "../document.entity";

const trim = Transform(({ value }) => (typeof value === "string" ? value.trim() : value));
const toInt = Transform(({ value }) => (typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value));
/** En multipart los campos llegan como texto: un campo vacio cuenta como ausente. */
const emptyAsUndefined = Transform(({ value }) => (value === "" ? undefined : value));
/** Lista de UUID enviada en multipart como texto separado por comas. */
const csvList = Transform(({ value }) =>
  typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value,
);

/** Campos del formulario multipart de carga; el archivo va en `file`. */
export class UploadDocumentDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptionalText(5000)
  description?: string;

  @emptyAsUndefined
  @IsOptional()
  @IsIn(DOCUMENT_CATEGORIES)
  category?: DocumentCategory;

  @emptyAsUndefined
  @IsOptional()
  @IsIn(ACCESS_LEVELS)
  accessLevel?: AccessLevel;

  /** Resultado del mismo proyecto al que se vincula (solo documentos de proyecto). */
  @emptyAsUndefined
  @IsOptional()
  @IsUUID("4")
  researchResultId?: string;

  /** Personas autorizadas (solo documentos privados). */
  @csvList
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  grantedUserIds?: string[];
}

/** Cambios parciales de metadatos; `grantedUserIds` reemplaza la lista completa. */
export class UpdateDocumentDto {
  @trim
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ValidateIf((_object, value) => value !== null)
  @IsOptionalText(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(DOCUMENT_CATEGORIES)
  category?: DocumentCategory;

  @IsOptional()
  @IsIn(ACCESS_LEVELS)
  accessLevel?: AccessLevel;

  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsUUID("4")
  researchResultId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  grantedUserIds?: string[];
}

export class ListDocumentsQuery {
  @trim
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(DOCUMENT_CATEGORIES)
  category?: DocumentCategory;

  @IsOptional()
  @IsIn(DOCUMENT_SCOPES)
  scope?: DocumentScope;

  @IsOptional()
  @IsUUID("4")
  projectId?: string;

  /** Documentos vinculados a un resultado (solo en la lista de un proyecto). */
  @IsOptional()
  @IsUUID("4")
  researchResultId?: string;

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
