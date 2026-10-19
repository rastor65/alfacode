import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { RequireRoles } from "../auth/auth.decorators";
import { RolesService } from "./roles.service";
import type {
  AssignUserRolesDto,
  CreateRoleDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
} from "./dto/roles.dto";

@Controller("roles")
@RequireRoles("admin", "coordinator")
export class RolesController {
  constructor(
    @Inject(RolesService)
    private readonly rolesService: RolesService,
  ) {}

  @Get()
  findAll() {
    return this.rolesService.findAllWithMetrics();
  }

  @Post()
  @HttpCode(201)
  @RequireRoles("admin")
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.rolesService.findById(id);
  }

  @Put(":id")
  @RequireRoles("admin")
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(":id")
  @RequireRoles("admin")
  delete(@Param("id") id: string) {
    return this.rolesService.deleteRole(id);
  }

  @Get(":id/resources")
  getRoleResources(@Param("id") id: string) {
    return this.rolesService.getRoleResources(id);
  }

  @Put(":id/resources")
  @RequireRoles("admin")
  updateRoleResources(@Param("id") id: string, @Body() dto: UpdateRolePermissionsDto) {
    return this.rolesService.updateRoleResources(id, dto.permissions || []);
  }

  @Get(":id/users")
  getRoleUsers(@Param("id") id: string) {
    return this.rolesService.getRoleUsers(id);
  }

  @Post("users/assign")
  @RequireRoles("admin", "coordinator")
  assignUserRoles(@Body() body: { userId: string; roleIds: string[] }) {
    return this.rolesService.assignUserRoles(body.userId, body.roleIds || []);
  }
}
