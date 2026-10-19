import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { SECURITY_CONFIG, type SecurityConfig } from "../../common/security.config";
import { toAuthUser } from "../users/users.service";
import { AllowPendingPasswordChange, type AuthContext, CurrentAuth, Public } from "./auth.decorators";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/password-reset.dto";
import { PasswordResetService } from "./password-reset.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { RegisterDto } from "./dto/registration.dto";
import { RegistrationService } from "./registration.service";
import { clearSessionCookies, readCookie, setSessionCookies } from "./session-cookies";
import { SessionsService } from "./sessions.service";
import { RolesService } from "../roles/roles.service";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly auth: AuthService,
    @Inject(SessionsService)
    private readonly sessions: SessionsService,
    @Inject(RegistrationService)
    private readonly registration: RegistrationService,
    @Inject(PasswordResetService)
    private readonly passwordReset: PasswordResetService,
    @Inject(RolesService)
    private readonly rolesService: RolesService,
    @Inject(SECURITY_CONFIG)
    private readonly config: SecurityConfig,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new DtoValidationPipe(LoginDto)) dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, {
      ip: request.ip ?? "unknown",
      currentSessionToken: readCookie(request, this.config.sessionCookieName),
    });

    setSessionCookies(response, this.config, result);

    const rbac = await this.rolesService.getUserAuthorizedRbac(result.user.id);

    return {
      user: {
        ...toAuthUser(result.user),
        resources: rbac.resources,
        menu: rbac.menu,
      },
      csrfToken: result.csrfToken,
    };
  }

  @Public()
  @Post("register")
  @HttpCode(202)
  register(@Body(new DtoValidationPipe(RegisterDto)) dto: RegisterDto, @Req() request: Request) {
    return this.registration.register(dto, request.ip ?? "unknown");
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(202)
  forgotPassword(@Body(new DtoValidationPipe(ForgotPasswordDto)) dto: ForgotPasswordDto, @Req() request: Request) {
    return this.passwordReset.request(dto.email, request.ip ?? "unknown");
  }

  @Public()
  @Post("reset-password")
  @HttpCode(200)
  resetPassword(@Body(new DtoValidationPipe(ResetPasswordDto)) dto: ResetPasswordDto, @Req() request: Request) {
    return this.passwordReset.reset(dto.token, dto.password, request.ip ?? "unknown");
  }

  /** Cambio de contrasena; es la unica accion posible mientras la contrasena es temporal. */
  @AllowPendingPasswordChange()
  @Post("change-password")
  @HttpCode(200)
  changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body(new DtoValidationPipe(ChangePasswordDto)) dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(auth.user.id, auth.session.id, dto);
  }

  @AllowPendingPasswordChange()
  @Post("logout")
  @HttpCode(204)
  async logout(@CurrentAuth() auth: AuthContext, @Res({ passthrough: true }) response: Response) {
    await this.sessions.revokeById(auth.session.id);
    clearSessionCookies(response, this.config);
  }

  @AllowPendingPasswordChange()
  @Get("me")
  async me(@CurrentAuth() auth: AuthContext) {
    const rbac = await this.rolesService.getUserAuthorizedRbac(auth.user.id);
    return {
      ...toAuthUser(auth.user),
      resources: rbac.resources,
      menu: rbac.menu,
    };
  }
}
