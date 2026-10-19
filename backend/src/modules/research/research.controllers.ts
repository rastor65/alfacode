import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth } from "../auth/auth.decorators";
import {
  CreateResearchLineDto,
  CreateResearchResultDto,
  LinkResearchLineDto,
  ListResearchLinesQuery,
  SaveResearchProfileDto,
  UpdateResearchLineDto,
  UpdateResearchResultDto,
} from "./dto/research.dto";
import { ProjectResearchService } from "./project-research.service";
import { ResearchLinesService } from "./research-lines.service";

const uuid = new ParseUUIDPipe({ version: "4" });

/** F3-01: catalogo institucional de lineas de investigacion. */
@Controller("research-lines")
export class ResearchLinesController {
  constructor(
    @Inject(ResearchLinesService)
    private readonly lines: ResearchLinesService,
  ) {}

  @Get()
  list(@CurrentAuth() auth: AuthContext, @Query(new DtoValidationPipe(ListResearchLinesQuery)) query: ListResearchLinesQuery) {
    return this.lines.list(auth.user, query);
  }

  @Post()
  create(@CurrentAuth() auth: AuthContext, @Body(new DtoValidationPipe(CreateResearchLineDto)) dto: CreateResearchLineDto) {
    return this.lines.create(auth.user, dto);
  }

  @Get(":lineId")
  detail(@CurrentAuth() auth: AuthContext, @Param("lineId", uuid) lineId: string) {
    return this.lines.detail(auth.user, lineId);
  }

  @Patch(":lineId")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("lineId", uuid) lineId: string,
    @Body(new DtoValidationPipe(UpdateResearchLineDto)) dto: UpdateResearchLineDto,
  ) {
    return this.lines.update(auth.user, lineId, dto);
  }

  @Delete(":lineId")
  @HttpCode(204)
  async remove(@CurrentAuth() auth: AuthContext, @Param("lineId", uuid) lineId: string) {
    await this.lines.remove(auth.user, lineId);
  }
}

/** F3-02 a F3-04: informacion investigativa de un proyecto; cada ruta comprueba el proyecto de la URL. */
@Controller("projects/:projectId")
export class ProjectResearchController {
  constructor(
    @Inject(ProjectResearchService)
    private readonly research: ProjectResearchService,
  ) {}

  @Get("research-lines")
  lines(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.research.lines(auth.user, projectId);
  }

  @Post("research-lines")
  linkLine(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(LinkResearchLineDto)) dto: LinkResearchLineDto,
  ) {
    return this.research.linkLine(auth.user, projectId, dto);
  }

  @Delete("research-lines/:lineId")
  unlinkLine(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("lineId", uuid) lineId: string) {
    return this.research.unlinkLine(auth.user, projectId, lineId);
  }

  @Get("research-profile")
  profile(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.research.profile(auth.user, projectId);
  }

  @Put("research-profile")
  saveProfile(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(SaveResearchProfileDto)) dto: SaveResearchProfileDto,
  ) {
    return this.research.saveProfile(auth.user, projectId, dto);
  }

  @Get("research-results")
  results(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string) {
    return this.research.results(auth.user, projectId);
  }

  @Post("research-results")
  createResult(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Body(new DtoValidationPipe(CreateResearchResultDto)) dto: CreateResearchResultDto,
  ) {
    return this.research.createResult(auth.user, projectId, dto);
  }

  @Get("research-results/:resultId")
  result(@CurrentAuth() auth: AuthContext, @Param("projectId", uuid) projectId: string, @Param("resultId", uuid) resultId: string) {
    return this.research.result(auth.user, projectId, resultId);
  }

  @Patch("research-results/:resultId")
  updateResult(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("resultId", uuid) resultId: string,
    @Body(new DtoValidationPipe(UpdateResearchResultDto)) dto: UpdateResearchResultDto,
  ) {
    return this.research.updateResult(auth.user, projectId, resultId, dto);
  }

  @Delete("research-results/:resultId")
  @HttpCode(204)
  async removeResult(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Param("resultId", uuid) resultId: string,
  ) {
    await this.research.removeResult(auth.user, projectId, resultId);
  }
}
