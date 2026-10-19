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
import { ResourcesService } from "./resources.service";
import type { CreateResourceDto, UpdateResourceDto } from "./dto/roles.dto";

@Controller("resources")
@RequireRoles("admin", "coordinator")
export class ResourcesController {
  constructor(
    @Inject(ResourcesService)
    private readonly resourcesService: ResourcesService,
  ) {}

  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Post()
  @HttpCode(201)
  @RequireRoles("admin")
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.resourcesService.findById(id);
  }

  @Put(":id")
  @RequireRoles("admin")
  update(@Param("id") id: string, @Body() dto: UpdateResourceDto) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(":id")
  @RequireRoles("admin")
  delete(@Param("id") id: string) {
    return this.resourcesService.delete(id);
  }
}
