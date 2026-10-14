import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth } from "../auth/auth.decorators";
import {
  AddProjectMemberDto,
  ChangeProjectMethodologyDto,
  ChangeProjectStatusDto,
  CreateProjectDto,
  ListProjectsQuery,
  RemoveProjectMemberQuery,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "./dto/projects.dto";
import { ProjectsService } from "./projects.service";

const uuid = new ParseUUIDPipe({ version: "4" });

/** API minima F2 (proyectos y equipos). El acceso se resuelve por proyecto en el servicio. */
@Controller("projects")
export class ProjectsController {
  constructor(
    @Inject(ProjectsService)
    private readonly projects: ProjectsService,
  ) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext, @Query(new DtoValidationPipe(ListProjectsQuery)) query: ListProjectsQuery) {
    return this.projects.list(auth.user, query);
  }

  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body(new DtoValidationPipe(CreateProjectDto)) dto: CreateProjectDto) {
    return this.projects.create(auth.user, dto);
  }

  @Get(":projectId")
  detail(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.projects.detail(auth.user, projectId);
  }

  @Patch(":projectId")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(UpdateProjectDto)) dto: UpdateProjectDto,
  ) {
    return this.projects.update(auth.user, projectId, dto);
  }

  @Post(":projectId/status")
  @HttpCode(200)
  changeStatus(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(ChangeProjectStatusDto)) dto: ChangeProjectStatusDto,
  ) {
    return this.projects.changeStatus(auth.user, projectId, dto);
  }

  @Post(":projectId/methodology")
  @HttpCode(200)
  changeMethodology(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(ChangeProjectMethodologyDto)) dto: ChangeProjectMethodologyDto,
  ) {
    return this.projects.changeMethodology(auth.user, projectId, dto);
  }

  @Get(":projectId/members")
  members(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.projects.members(auth.user, projectId);
  }

  @Post(":projectId/members")
  addMember(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(AddProjectMemberDto)) dto: AddProjectMemberDto,
  ) {
    return this.projects.addMember(auth.user, projectId, dto);
  }

  @Patch(":projectId/members/:userId")
  updateMember(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("userId", uuid) userId: string,
    @Body(new DtoValidationPipe(UpdateProjectMemberDto)) dto: UpdateProjectMemberDto,
  ) {
    return this.projects.updateMember(auth.user, projectId, userId, dto);
  }

  @Delete(":projectId/members/:userId")
  removeMember(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("userId", uuid) userId: string,
    @Query(new DtoValidationPipe(RemoveProjectMemberQuery)) query: RemoveProjectMemberQuery,
  ) {
    return this.projects.removeMember(auth.user, projectId, userId, query);
  }
}
