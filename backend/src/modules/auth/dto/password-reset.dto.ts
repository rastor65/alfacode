import { IsEmailField, IsNewPassword, IsSecureToken } from "../../../common/validation";

export class ForgotPasswordDto {
  @IsEmailField()
  email!: string;
}

export class ResetPasswordDto {
  @IsSecureToken()
  token!: string;

  @IsNewPassword()
  password!: string;
}
