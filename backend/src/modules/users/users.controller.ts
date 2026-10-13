import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { ApiError } from "../../common/api-error";
import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth, RequireRoles } from "../auth/auth.decorators";
import { isRoleCode } from "../roles/role-policy";
import type { RoleCode } from "../roles/role.entity";
import { AssignRoleDto, ListUsersQuery, UpdateProfileDto, UpdateUserStatusDto } from "./dto/users.dto";
import { MembersService } from "./members.service";
import { UsersService } from "./users.service";

const uuid = new ParseUUIDPipe({ version: "4" });

function parseRoleCode(value: string): RoleCode {
  if (!isRoleCode(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Rol desconocido", [{ field: "roleCode", rules: ["isIn"] }]);
  }

  return value;
}

@Controller("users")
export class UsersController {
  constructor(
    @Inject(UsersService)
    private readonly users: UsersService,
    @Inject(MembersService)
    private readonly members: MembersService,
  ) {}

  // Las rutas `me` se declaran antes de `:id`.
  @Get("me")
  me(@CurrentAuth() auth: AuthContext) {
    return this.users.getProfile(auth.user.id);
  }

  @Patch("me")
  updateMe(@CurrentAuth() auth: AuthContext, @Body(new DtoValidationPipe(UpdateProfileDto)) dto: UpdateProfileDto) {
    return this.users.updateProfile(auth.user.id, dto);
  }

  /** Cualquier integrante con sesion; las autoridades ven mas datos y pueden filtrar por estado. */
  @Get()
  list(@CurrentAuth() auth: AuthContext, @Query(new DtoValidationPipe(ListUsersQuery)) query: ListUsersQuery) {
    return this.members.list(auth.user, query);
  }

  @RequireRoles("admin", "coordinator")
  @Get(":id")
  detail(@Param("id", uuid) id: string) {
    return this.members.detail(id);
  }

  @RequireRoles("admin", "coordinator")
  @Patch(":id/status")
  updateStatus(
    @CurrentAuth() auth: AuthContext,
    @Param("id", uuid) id: string,
    @Body(new DtoValidationPipe(UpdateUserStatusDto)) dto: UpdateUserStatusDto,
  ) {
    return this.members.updateStatus(auth.user, id, dto);
  }

  @RequireRoles("admin", "coordinator")
  @Post(":id/temporary-password")
  @HttpCode(200)
  reissueTemporaryPassword(@CurrentAuth() auth: AuthContext, @Param("id", uuid) id: string) {
    return this.members.reissueTemporaryPassword(auth.user, id);
  }

  @RequireRoles("admin", "coordinator")
  @Post(":id/roles")
  assignRole(
    @CurrentAuth() auth: AuthContext,
    @Param("id", uuid) id: string,
    @Body(new DtoValidationPipe(AssignRoleDto)) dto: AssignRoleDto,
  ) {
    return this.members.assignRole(auth.user, id, dto.roleCode);
  }

  @RequireRoles("admin", "coordinator")
  @Delete(":id/roles/:roleCode")
  removeRole(@CurrentAuth() auth: AuthContext, @Param("id", uuid) id: string, @Param("roleCode") roleCode: string) {
    return this.members.removeRole(auth.user, id, parseRoleCode(roleCode));
  }
}
