import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators";
import { ObservationsService } from "./observations.service";
import { ReportsService } from "./reports.service";
import { CreateObservationDto, EventReportQuery, ProductReportQuery, ProjectReportQuery, TrackingPageQuery } from "./tracking.dto";
import { TrackingService } from "./tracking.service";
const uuid = new ParseUUIDPipe({ version: "4" });

/** F6-02 a F6-04 y F6-06: paneles y reportes de solo lectura; los permisos se aplican antes de contar. */
@Controller("tracking")
export class TrackingController {
  constructor(@Inject(TrackingService) private readonly service: TrackingService, @Inject(ReportsService) private readonly reports: ReportsService) {}
  @Get("institutional") institutional(@CurrentAuth() a: AuthContext) { return this.service.institutional(a.user); }
  @Get("me") me(@CurrentAuth() a: AuthContext) { return this.service.me(a.user); }
  @Get("projects/:id") project(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.project(a.user, id); }
  @Get("reports/projects") projectReport(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ProjectReportQuery)) q: ProjectReportQuery) { return this.reports.projects(a.user, q); }
  @Get("reports/products") productReport(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ProductReportQuery)) q: ProductReportQuery) { return this.reports.products(a.user, q); }
  @Get("reports/events") eventReport(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(EventReportQuery)) q: EventReportQuery) { return this.reports.events(a.user, q); }
}

/** F6-05: observaciones cualitativas del proyecto. */
@Controller("projects/:projectId/observations")
export class ObservationsController {
  constructor(@Inject(ObservationsService) private readonly service: ObservationsService) {}
  @Get() list(@CurrentAuth() a: AuthContext, @Param("projectId", uuid) projectId: string, @Query(new DtoValidationPipe(TrackingPageQuery)) q: TrackingPageQuery) { return this.service.list(a.user, projectId, q); }
  @Post() create(@CurrentAuth() a: AuthContext, @Param("projectId", uuid) projectId: string, @Body(new DtoValidationPipe(CreateObservationDto)) dto: CreateObservationDto) { return this.service.create(a.user, projectId, dto); }
  @Delete(":id") @HttpCode(204) remove(@CurrentAuth() a: AuthContext, @Param("projectId", uuid) projectId: string, @Param("id", uuid) id: string) { return this.service.remove(a.user, projectId, id); }
}
