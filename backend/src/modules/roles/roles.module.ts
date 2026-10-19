import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Resource } from "./resource.entity";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { RoleResource } from "./role-resource.entity";
import { Role } from "./role.entity";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  imports: [TypeOrmModule.forFeature([Role, Resource, RoleResource])],
  controllers: [RolesController, ResourcesController],
  providers: [RolesService, ResourcesService],
  exports: [RolesService, ResourcesService],
})
export class RolesModule {}
