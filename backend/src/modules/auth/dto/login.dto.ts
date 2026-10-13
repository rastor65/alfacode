import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  // Se recorta antes de validar; la normalizacion completa (minusculas) ocurre en UsersService.
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(254)
  @IsEmail()
  email!: string;

  // Limite superior para que una contrasena enorme no se use para agotar CPU en Argon2.
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  password!: string;
}
