import { IsString, MaxLength, MinLength } from "class-validator";

import { IsNewPassword } from "../../../common/validation";

export class ChangePasswordDto {
  /** La contrasena actual (o la temporal recibida por correo). */
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  currentPassword!: string;

  @IsNewPassword()
  newPassword!: string;
}
