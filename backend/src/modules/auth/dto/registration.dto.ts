import { IsEmailField, IsFullName, IsOptionalText } from "../../../common/validation";

/** Solicitud de vinculacion (DEC-016): sin contrasena; se genera una temporal al aprobarla. */
export class RegisterDto {
  @IsFullName()
  fullName!: string;

  @IsEmailField()
  email!: string;

  /** Motivo de la solicitud, visible para quien la revisa. */
  @IsOptionalText(1000)
  message?: string;
}
