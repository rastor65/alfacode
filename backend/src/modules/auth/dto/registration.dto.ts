import { Type } from "class-transformer";
import { IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

import { IsEmailField, IsFullName, IsOptionalText } from "../../../common/validation";

/** Estructura de la Hoja de Vida (RESUMEN) de aspirantes al semillero */
export class StudentCvDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fechaElaboracion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  apellidos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nacionalidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentoIdentidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  celular?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefonoFijo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  facultad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  programa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sede?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  semestreActual?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  promedioAcademico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  experienciaInvestigativa?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  areasEstudio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  lineasInvestigacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  publicaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  practicasPasantias?: string;
}

/** Solicitud de vinculacion (DEC-016): sin contrasena; se genera una temporal al aprobarla. */
export class RegisterDto {
  @IsFullName()
  fullName!: string;

  @IsEmailField()
  email!: string;

  /** Motivo o mensaje adicional de la solicitud, visible para quien la revisa. */
  @IsOptionalText(2000)
  message?: string;

  /** Hoja de vida estructurada del aspirante */
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentCvDto)
  cvData?: StudentCvDto;
}
