import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDefined, IsIn, IsInt, IsOptional, IsString, IsUrl, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { IsOptionalText } from "../../common/validation";
import { PRODUCT_STATUSES, PRODUCT_TYPES } from "./academic.entities";

const trim = Transform(({ value }) => typeof value === "string" ? value.trim() : value);
const integer = Transform(({ value }) => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value);

export class AuthorDto {
  @IsOptional() @IsUUID("4") userId?: string;
  @IsOptionalText(160) externalName?: string;
}

/** PUT reemplaza los campos editables; no acepta IDs ni autor de creacion. */
export class SaveProductDto {
  @trim @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsIn(PRODUCT_TYPES) type!: typeof PRODUCT_TYPES[number];
  @IsIn(PRODUCT_STATUSES) status!: typeof PRODUCT_STATUSES[number];
  @IsOptionalText(10000) description?: string;
  @IsOptionalText(300) source?: string;
  @IsOptional() @trim @Matches(/^10\.\d{4,9}\/\S+$/) @MaxLength(200) doi?: string;
  @IsOptional() @trim @IsUrl({ protocols: ["http", "https"], require_protocol: true }) @MaxLength(2000) url?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) productDate?: string;
  @IsOptional() @IsUUID("4") projectId?: string;
  @IsDefined() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => AuthorDto) authors!: AuthorDto[];
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(50) @IsUUID("4", { each: true }) resultIds?: string[];
}

export class SaveRecognitionDto {
  @trim @IsString() @MinLength(3) @MaxLength(200) title!: string;
  @IsOptionalText(10000) description?: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) recognitionDate!: string;
  @IsOptional() @IsUUID("4") userId?: string;
  @IsOptional() @IsUUID("4") projectId?: string;
  @IsOptional() @IsUUID("4") evidenceDocumentId?: string;
}

export class ListAcademicQuery {
  @IsOptionalText(100) q?: string;
  @IsOptional() @IsUUID("4") projectId?: string;
  @IsOptional() @IsUUID("4") authorId?: string;
  @IsOptional() @IsIn(PRODUCT_TYPES) type?: typeof PRODUCT_TYPES[number];
  @IsOptional() @IsIn(PRODUCT_STATUSES) status?: typeof PRODUCT_STATUSES[number];
  @IsOptional() @integer @IsInt() @Min(1) page = 1;
  @IsOptional() @integer @IsInt() @Min(1) @Max(100) pageSize = 20;
}
