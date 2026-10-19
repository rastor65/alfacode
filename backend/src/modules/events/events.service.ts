import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { DocumentsService } from "../documents/documents.service";
import { DocumentRecord } from "../documents/document.entity";
import { actorRoles, type Actor, loadManageableProject } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { isCalendarDate } from "../projects/projects.service";
import { isAuthority } from "../roles/role-policy";
import { User } from "../users/user.entity";
import type { AttendanceDto, EventPageQuery, EventStatusDto, ListEventsQuery, ParticipantDto, SaveEventDto } from "./event.dto";
import { EventDocument, EventParticipant, EventRecord } from "./event.entities";

const missing = () => new ApiError(404, "EVENT_NOT_FOUND", "Actividad no encontrada");
const forbidden = () => new ApiError(403, "EVENT_FORBIDDEN", "No tienes permiso para esta accion en la actividad");
const invalid = (message: string) => new ApiError(400, "EVENT_INVALID", message);
const conflict = (message: string) => new ApiError(409, "EVENT_CONFLICT", message);
const authority = (actor: Actor) => isAuthority(actorRoles(actor));
const transitions: Record<EventRecord["status"], EventRecord["status"][]> = { scheduled: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [] };

@Injectable()
export class EventsService {
  constructor(@InjectDataSource() private readonly db: DataSource, @Inject(DocumentsService) private readonly documents: DocumentsService) {}

  async list(actor: Actor, q: ListEventsQuery) {
    const b = this.db.createQueryBuilder(EventRecord, "e");
    if (!authority(actor)) b.andWhere("(e.project_id IS NULL OR EXISTS (SELECT 1 FROM project_members m WHERE m.project_id=e.project_id AND m.user_id=:viewer))", { viewer: actor.id });
    if (q.q) b.andWhere("LOWER(e.title) LIKE LOWER(:search) ESCAPE '\\'", { search: `%${q.q.replace(/[\\%_]/g, "\\$&")}%` });
    if (q.type) b.andWhere("e.type=:type", { type: q.type });
    if (q.status) b.andWhere("e.status=:status", { status: q.status });
    if (q.projectId) b.andWhere("e.project_id=:project", { project: q.projectId });
    for (const date of [q.from, q.to]) if (date && !isCalendarDate(date)) throw invalid("La fecha del filtro no es valida");
    if (q.from && q.to && q.from > q.to) throw invalid("El inicio del filtro debe ser anterior al fin");
    if (q.from) b.andWhere("e.ends_at > :from", { from: new Date(`${q.from}T00:00:00-05:00`).toISOString() });
    if (q.to) { const end = new Date(`${q.to}T00:00:00-05:00`); end.setUTCDate(end.getUTCDate() + 1); b.andWhere("e.starts_at < :to", { to: end.toISOString() }); }
    const [events, total] = await b.orderBy("e.starts_at", "ASC").addOrderBy("e.id", "ASC").skip((q.page - 1) * q.pageSize).take(q.pageSize).getManyAndCount();
    return { items: await Promise.all(events.map(e => this.view(this.db.manager, actor, e))), page: q.page, pageSize: q.pageSize, total, permissions: { canCreateInstitutional: authority(actor) } };
  }
  async detail(actor: Actor, id: string) { return this.view(this.db.manager, actor, await this.load(this.db.manager, actor, id)); }

  async save(actor: Actor, dto: SaveEventDto, id?: string) {
    return this.db.transaction(async m => {
      const old = id ? await this.load(m, actor, id) : null;
      const projectId = dto.projectId || null;
      if (old) {
        await this.manage(m, actor, old);
        if (!["scheduled", "in_progress"].includes(old.status)) throw conflict("La actividad finalizada o cancelada no admite cambios de datos");
        if (old.projectId !== projectId) throw conflict("No se cambia el proyecto de una actividad existente");
      } else if (projectId) await loadManageableProject(m, actor, projectId);
      else if (!authority(actor)) throw forbidden();
      await this.eligible(m, dto.organizerId, projectId);
      const start = new Date(dto.startsAt), end = new Date(dto.endsAt);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw invalid("Las fechas de la actividad no son validas");
      const startsAt = start.toISOString(), endsAt = end.toISOString();
      if (startsAt.length !== 24 || endsAt.length !== 24) throw invalid("Las fechas deben usar anos de cuatro digitos");
      if (endsAt <= startsAt) throw invalid("La fecha y hora final debe ser posterior al inicio");
      if (dto.mode !== "online" && !dto.location?.trim()) throw invalid("Indica la ubicacion de la actividad presencial o hibrida");
      if (dto.mode !== "onsite" && !dto.url?.trim()) throw invalid("Indica el enlace de la actividad virtual o hibrida");
      if (dto.type !== "call" && (dto.externalOrganizer || dto.requirements || dto.registrationUrl)) throw invalid("Los requisitos de convocatoria solo corresponden al tipo convocatoria");
      const event = await m.save(EventRecord, m.create(EventRecord, { ...(old ?? {}), title: dto.title, description: dto.description || null,
        type: dto.type, mode: dto.mode, startsAt, endsAt, organizerId: dto.organizerId, projectId,
        location: dto.location || null, url: dto.url || null, externalOrganizer: dto.externalOrganizer || null,
        requirements: dto.requirements || null, registrationUrl: dto.registrationUrl || null,
        status: old?.status ?? "scheduled", createdBy: old ? old.createdBy : actor.id, cancellationReason: old?.cancellationReason ?? null }));
      if (old && old.organizerId !== event.organizerId) await m.update(EventParticipant, { eventId: event.id, userId: old.organizerId }, { role: "participant" });
      const organizer = await m.findOneBy(EventParticipant, { eventId: event.id, userId: event.organizerId });
      await m.save(EventParticipant, m.create(EventParticipant, { ...(organizer ?? {}), eventId: event.id, userId: event.organizerId, role: "organizer", attendance: organizer?.attendance ?? "registered" }));
      await this.audit(m, actor, old ? "event.updated" : "event.created", event.id);
      return this.view(m, actor, event);
    });
  }

  async status(actor: Actor, id: string, dto: EventStatusDto) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      if (!transitions[e.status].includes(dto.status)) throw conflict("Transicion de estado no permitida");
      if (dto.status === "cancelled" && !dto.reason?.trim()) throw invalid("Indica el motivo de cancelacion");
      const from = e.status; e.status = dto.status; e.cancellationReason = dto.status === "cancelled" ? dto.reason!.trim() : null;
      await m.save(e); await this.audit(m, actor, "event.status_changed", id, { from, to: e.status, reason: e.cancellationReason });
      return this.view(m, actor, e);
    });
  }
  async remove(actor: Actor, id: string) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      const participants = await m.countBy(EventParticipant, { eventId: id });
      if (e.status !== "scheduled" || participants > 1 || await m.existsBy(EventDocument, { eventId: id })) throw conflict("Solo se elimina una actividad programada sin otros participantes ni evidencias; usa cancelar para conservar su historial");
      await m.delete(EventRecord, { id }); await this.audit(m, actor, "event.deleted", id);
    });
  }
  async participants(actor: Actor, id: string, q: EventPageQuery) {
    const e = await this.load(this.db.manager, actor, id);
    const b = this.db.createQueryBuilder(EventParticipant, "p").innerJoin(User, "u", "u.id=p.user_id").where("p.event_id=:id", { id });
    const total = await b.getCount();
    const rows = await b.select(["p.user_id AS userId", "u.full_name AS fullName", "p.role AS role", "p.attendance AS attendance", "p.recorded_at AS recordedAt"]).orderBy("u.full_name", "ASC").addOrderBy("p.user_id", "ASC").offset((q.page - 1) * q.pageSize).limit(q.pageSize).getRawMany();
    return { items: rows, total, page: q.page, pageSize: q.pageSize, permissions: await this.permissions(this.db.manager, actor, e) };
  }
  async addParticipant(actor: Actor, id: string, dto: ParticipantDto) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      if (!["scheduled", "in_progress"].includes(e.status)) throw conflict("No se agregan participantes a actividades finalizadas o canceladas");
      await this.eligible(m, dto.userId, e.projectId);
      if (await m.existsBy(EventParticipant, { eventId: id, userId: dto.userId })) throw conflict("El integrante ya esta registrado en esta actividad");
      await m.insert(EventParticipant, { eventId: id, userId: dto.userId, role: dto.role, attendance: "registered" });
      await this.audit(m, actor, "event.participant_added", id, { userId: dto.userId, role: dto.role });
      return { userId: dto.userId, role: dto.role, attendance: "registered" };
    });
  }
  async removeParticipant(actor: Actor, id: string, userId: string) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      if (!["scheduled", "in_progress"].includes(e.status)) throw conflict("La actividad no admite retiros");
      if (e.organizerId === userId) throw conflict("Cambia el responsable antes de retirar al organizador principal");
      const p = await m.findOneBy(EventParticipant, { eventId: id, userId });
      if (!p) throw missing();
      if (p.attendance !== "registered") throw conflict("La asistencia registrada se conserva como historial");
      await m.delete(EventParticipant, { eventId: id, userId });
      await this.audit(m, actor, "event.participant_removed", id, { userId });
    });
  }
  async attendance(actor: Actor, id: string, userId: string, dto: AttendanceDto) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id);
      if (!authority(actor)) throw forbidden();
      if (!["in_progress", "completed"].includes(e.status)) throw conflict("La asistencia se registra durante o despues de la actividad, nunca al estar cancelada");
      const p = await m.findOneBy(EventParticipant, { eventId: id, userId });
      if (!p) throw missing();
      const from = p.attendance;
      p.attendance = dto.attendance; p.recordedBy = actor.id; p.recordedAt = new Date().toISOString();
      await m.save(p); await this.audit(m, actor, "event.attendance_changed", id, { userId, from, to: p.attendance });
      return { userId, attendance: p.attendance, recordedAt: p.recordedAt };
    });
  }

  async evidence(actor: Actor, id: string, q: EventPageQuery) {
    await this.load(this.db.manager, actor, id);
    const links = await this.db.manager.findBy(EventDocument, { eventId: id });
    const visible = await Promise.all(links.map(async link => {
      try { const doc = await this.documents.detail(actor, link.documentId); return { id: doc.id, title: doc.title, category: doc.category }; }
      catch (error) { if (error instanceof ApiError && error.getStatus() === 404) return null; throw error; }
    }));
    const items = visible.filter((doc): doc is NonNullable<typeof doc> => doc !== null).sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
    return { items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), total: items.length, page: q.page, pageSize: q.pageSize };
  }
  async linkDocument(actor: Actor, id: string, documentId: string) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      if (e.status === "cancelled") throw conflict("La actividad cancelada conserva sus evidencias en solo lectura");
      await this.documents.detail(actor, documentId);
      const document = await m.findOneByOrFail(DocumentRecord, { id: documentId });
      if (document.projectId !== e.projectId) throw invalid("El documento debe pertenecer al mismo ambito que la actividad");
      if (await m.existsBy(EventDocument, { eventId: id, documentId })) throw conflict("El documento ya esta vinculado");
      await m.insert(EventDocument, { eventId: id, documentId });
      await this.audit(m, actor, "event.document_linked", id, { documentId });
      return { documentId };
    });
  }
  async unlinkDocument(actor: Actor, id: string, documentId: string) {
    return this.db.transaction(async m => {
      const e = await this.load(m, actor, id); await this.manage(m, actor, e);
      if (e.status === "cancelled") throw conflict("La actividad cancelada conserva sus evidencias en solo lectura");
      await this.documents.detail(actor, documentId);
      if (!(await m.delete(EventDocument, { eventId: id, documentId })).affected) throw missing();
      await this.audit(m, actor, "event.document_unlinked", id, { documentId });
    });
  }
  private async load(m: EntityManager, actor: Actor, id: string) {
    const e = await m.findOneBy(EventRecord, { id });
    if (!e || (e.projectId && !authority(actor) && !await m.existsBy(ProjectMember, { projectId: e.projectId, userId: actor.id }))) throw missing();
    return e;
  }
  private async eligible(m: EntityManager, userId: string, projectId: string | null) {
    const user = await m.findOneBy(User, { id: userId });
    if (!user || user.accountStatus !== "active") throw invalid("El integrante debe estar activo");
    if (projectId && !await m.existsBy(ProjectMember, { projectId, userId })) throw invalid("El integrante debe pertenecer al proyecto");
  }
  private async manages(m: EntityManager, actor: Actor, e: EventRecord) {
    return authority(actor) || e.organizerId === actor.id || Boolean(e.projectId && await m.existsBy(ProjectMember, { projectId: e.projectId, userId: actor.id, role: "leader" }));
  }
  private async manage(m: EntityManager, actor: Actor, e: EventRecord) { if (!await this.manages(m, actor, e)) throw forbidden(); }
  private async permissions(m: EntityManager, actor: Actor, e: EventRecord) {
    const manages = await this.manages(m, actor, e), open = ["scheduled", "in_progress"].includes(e.status);
    return { canEdit: manages && open, canManageParticipants: manages && open,
      canRecordAttendance: authority(actor) && ["in_progress", "completed"].includes(e.status),
      canManageEvidence: manages && e.status !== "cancelled", canUploadEvidence: manages && e.status !== "cancelled" && (Boolean(e.projectId) || authority(actor)),
      allowedTransitions: manages ? transitions[e.status] : [], canDelete: manages && e.status === "scheduled" && await m.countBy(EventParticipant, { eventId: e.id }) === 1 && !await m.existsBy(EventDocument, { eventId: e.id }) };
  }
  private async view(m: EntityManager, actor: Actor, e: EventRecord) {
    const [organizer, project, participantCount, permissions] = await Promise.all([
      m.findOneBy(User, { id: e.organizerId }), e.projectId ? m.findOneBy(Project, { id: e.projectId }) : null,
      m.countBy(EventParticipant, { eventId: e.id }), this.permissions(m, actor, e),
    ]);
    return { ...e, organizer: { id: e.organizerId, fullName: organizer?.fullName ?? "Integrante" }, project: project ? { id: project.id, name: project.name } : null, participantCount, permissions };
  }
  private audit(m: EntityManager, actor: Actor, action: string, id: string, details?: Record<string, unknown>) {
    return recordAudit(m, { actorUserId: actor.id, action, targetType: "event", targetId: id, details });
  }
}
