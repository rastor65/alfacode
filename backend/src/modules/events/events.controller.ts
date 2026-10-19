import { Body, Controller, Delete, Get, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Put, Query } from "@nestjs/common";
import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { CurrentAuth, type AuthContext } from "../auth/auth.decorators";
import { AttendanceDto, EventDocumentDto, EventPageQuery, EventStatusDto, ListEventsQuery, ParticipantDto, SaveEventDto } from "./event.dto";
import { EventsService } from "./events.service";
const uuid = new ParseUUIDPipe({ version: "4" });
@Controller("events")
export class EventsController {
  constructor(@Inject(EventsService) private readonly service: EventsService) {}
  @Get() list(@CurrentAuth() a: AuthContext, @Query(new DtoValidationPipe(ListEventsQuery)) q: ListEventsQuery) { return this.service.list(a.user, q); }
  @Post() create(@CurrentAuth() a: AuthContext, @Body(new DtoValidationPipe(SaveEventDto)) dto: SaveEventDto) { return this.service.save(a.user, dto); }
  @Get(":id") detail(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.detail(a.user, id); }
  @Put(":id") update(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(SaveEventDto)) dto: SaveEventDto) { return this.service.save(a.user, dto, id); }
  @Delete(":id") @HttpCode(204) remove(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string) { return this.service.remove(a.user, id); }
  @Post(":id/status") @HttpCode(200) status(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(EventStatusDto)) dto: EventStatusDto) { return this.service.status(a.user, id, dto); }
  @Get(":id/participants") participants(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Query(new DtoValidationPipe(EventPageQuery)) q: EventPageQuery) { return this.service.participants(a.user, id, q); }
  @Post(":id/participants") add(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(ParticipantDto)) dto: ParticipantDto) { return this.service.addParticipant(a.user, id, dto); }
  @Delete(":id/participants/:userId") @HttpCode(204) unregister(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Param("userId", uuid) userId: string) { return this.service.removeParticipant(a.user, id, userId); }
  @Patch(":id/participants/:userId/attendance") attendance(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Param("userId", uuid) userId: string, @Body(new DtoValidationPipe(AttendanceDto)) dto: AttendanceDto) { return this.service.attendance(a.user, id, userId, dto); }
  @Get(":id/documents") documents(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Query(new DtoValidationPipe(EventPageQuery)) q: EventPageQuery) { return this.service.evidence(a.user, id, q); }
  @Post(":id/documents") link(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Body(new DtoValidationPipe(EventDocumentDto)) dto: EventDocumentDto) { return this.service.linkDocument(a.user, id, dto.documentId); }
  @Delete(":id/documents/:documentId") @HttpCode(204) unlink(@CurrentAuth() a: AuthContext, @Param("id", uuid) id: string, @Param("documentId", uuid) documentId: string) { return this.service.unlinkDocument(a.user, id, documentId); }
}
