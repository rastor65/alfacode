import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth } from "../auth/auth.decorators";
import { CreateTaskDto, ListTasksQuery, UpdateTaskDto } from "./dto/tasks.dto";
import { TasksService } from "./tasks.service";

const uuid = new ParseUUIDPipe({ version: "4" });

/** API minima F2 (tareas). Cada ruta comprueba el proyecto de la URL y el de la tarea. */
@Controller("projects/:projectId/tasks")
export class TasksController {
  constructor(
    @Inject(TasksService)
    private readonly tasks: TasksService,
  ) {}

  @Get()
  list(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Query(new DtoValidationPipe(ListTasksQuery)) query: ListTasksQuery,
  ) {
    return this.tasks.list(auth.user, projectId, query);
  }

  @Post()
  create(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(CreateTaskDto)) dto: CreateTaskDto,
  ) {
    return this.tasks.create(auth.user, projectId, dto);
  }

  @Get(":taskId")
  detail(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("taskId", uuid) taskId: string) {
    return this.tasks.detail(auth.user, projectId, taskId);
  }

  @Patch(":taskId")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("taskId", uuid) taskId: string,
    @Body(new DtoValidationPipe(UpdateTaskDto)) dto: UpdateTaskDto,
  ) {
    return this.tasks.update(auth.user, projectId, taskId, dto);
  }
}
