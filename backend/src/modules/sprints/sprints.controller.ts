import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth } from "../auth/auth.decorators";
import { AddSprintTasksDto, CancelSprintDto, CreateSprintDto, UpdateSprintDto } from "./dto/sprints.dto";
import { SprintsService } from "./sprints.service";

const uuid = new ParseUUIDPipe({ version: "4" });

/** API minima F2 (sprints, solo proyectos agiles). Cada ruta comprueba el proyecto de la URL. */
@Controller("projects/:projectId/sprints")
export class SprintsController {
  constructor(
    @Inject(SprintsService)
    private readonly sprints: SprintsService,
  ) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.sprints.list(auth.user, projectId);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(CreateSprintDto)) dto: CreateSprintDto,
  ) {
    return this.sprints.create(auth.user, projectId, dto);
  }

  @Get(":sprintId")
  detail(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("sprintId", uuid) sprintId: string) {
    return this.sprints.detail(auth.user, projectId, sprintId);
  }

  @Patch(":sprintId")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("sprintId", uuid) sprintId: string,
    @Body(new DtoValidationPipe(UpdateSprintDto)) dto: UpdateSprintDto,
  ) {
    return this.sprints.update(auth.user, projectId, sprintId, dto);
  }

  @Post(":sprintId/tasks")
  @HttpCode(200)
  addTasks(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("sprintId", uuid) sprintId: string,
    @Body(new DtoValidationPipe(AddSprintTasksDto)) dto: AddSprintTasksDto,
  ) {
    return this.sprints.addTasks(auth.user, projectId, sprintId, dto);
  }

  @Delete(":sprintId/tasks/:taskId")
  removeTask(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("sprintId", uuid) sprintId: string,
    @Param("taskId", uuid) taskId: string,
  ) {
    return this.sprints.removeTask(auth.user, projectId, sprintId, taskId);
  }

  @Post(":sprintId/start")
  @HttpCode(200)
  start(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("sprintId", uuid) sprintId: string) {
    return this.sprints.start(auth.user, projectId, sprintId);
  }

  @Post(":sprintId/complete")
  @HttpCode(200)
  complete(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("sprintId", uuid) sprintId: string) {
    return this.sprints.complete(auth.user, projectId, sprintId);
  }

  @Post(":sprintId/cancel")
  @HttpCode(200)
  cancel(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("sprintId", uuid) sprintId: string,
    @Body(new DtoValidationPipe(CancelSprintDto)) dto: CancelSprintDto,
  ) {
    return this.sprints.cancel(auth.user, projectId, sprintId, dto);
  }
}
