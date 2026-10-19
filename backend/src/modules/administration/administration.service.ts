import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { AuditEvent } from "../audit/audit-event.entity";
import { actorRoles, type Actor } from "../projects/project-access";
import { canManageUser, isAuthority } from "../roles/role-policy";
import { User } from "../users/user.entity";
import { AdministrativeRequest, type RequestStatus } from "./administrative-request.entity";
import type { CreateAdministrativeRequestDto, ListAdministrativeRequestsQuery, RequestPageQuery, RequestStatusDto } from "./administrative-request.dto";

const authority = (actor: Actor) => isAuthority(actorRoles(actor));
const missing = () => new ApiError(404, "ADMINISTRATIVE_REQUEST_NOT_FOUND", "Solicitud no encontrada");
const forbidden = () => new ApiError(403, "ADMINISTRATIVE_REQUEST_FORBIDDEN", "No tienes permiso para tramitar esta solicitud");
const conflict = (message: string) => new ApiError(409, "ADMINISTRATIVE_REQUEST_STATE", message);
const transitions: Record<RequestStatus, RequestStatus[]> = {
  pending: ["in_review"], in_review: ["approved", "rejected"], approved: ["completed"], rejected: [], completed: [],
};
const actions = ["administrative_request.created", "administrative_request.reviewer_assigned", "administrative_request.status_changed", "administrative_request.withdrawal_executed", "administrative_request.document_added", "administrative_request.document_removed"];

@Injectable()
export class AdministrationService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async list(actor: Actor, q: ListAdministrativeRequestsQuery) {
    if (q.view === "review" && !authority(actor)) throw forbidden();
    const b = this.db.createQueryBuilder(AdministrativeRequest, "r");
    // La bandeja propia siempre se limita al solicitante, aunque tenga rol de autoridad.
    if (q.view === "mine") b.andWhere("r.requester_id = :viewer", { viewer: actor.id });
    if (q.type) b.andWhere("r.type = :type", { type: q.type });
    if (q.status) b.andWhere("r.status = :status", { status: q.status });
    if (q.reviewerId) b.andWhere("r.reviewer_id = :reviewer", { reviewer: q.reviewerId });
    if (q.q) b.andWhere("LOWER(r.subject) LIKE LOWER(:q) ESCAPE '\\'", { q: `%${q.q.replace(/[\\%_]/g, "\\$&")}%` });
    const [rows, total] = await b.orderBy("r.created_at", "DESC").addOrderBy("r.id", "ASC")
      .skip((q.page - 1) * q.pageSize).take(q.pageSize).getManyAndCount();
    return { items: await Promise.all(rows.map(r => this.view(this.db.manager, actor, r))), total, page: q.page, pageSize: q.pageSize, permissions: { canReview: authority(actor) } };
  }
  async create(actor: Actor, dto: CreateAdministrativeRequestDto) {
    return this.db.transaction(async m => {
      const row = await m.save(AdministrativeRequest, m.create(AdministrativeRequest, {
        ...dto, requesterId: actor.id, status: "pending", reviewerId: null, response: null,
        reviewedBy: null, reviewedAt: null, completedBy: null, completedAt: null,
      }));
      await this.audit(m, actor, "administrative_request.created", row.id, { type: row.type });
      return this.view(m, actor, row);
    });
  }
  async detail(actor: Actor, id: string) { return this.view(this.db.manager, actor, await this.load(this.db.manager, actor, id)); }

  async reviewers(actor: Actor, q: RequestPageQuery) {
    if (!authority(actor)) throw forbidden();
    const [rows, total] = await this.db.createQueryBuilder(User, "u").innerJoin("u.roles", "role", "role.code IN (:...roles)", { roles: ["admin", "coordinator"] })
      .where("u.accountStatus = :active", { active: "active" }).orderBy("u.fullName", "ASC").addOrderBy("u.id", "ASC")
      .skip((q.page - 1) * q.pageSize).take(q.pageSize).getManyAndCount();
    return { items: rows.map(u => ({ id: u.id, fullName: u.fullName })), total, page: q.page, pageSize: q.pageSize };
  }

  async assign(actor: Actor, id: string, reviewerId: string) {
    return this.db.transaction(async m => {
      const row = await this.load(m, actor, id); this.manage(actor, row);
      if (!["pending", "in_review"].includes(row.status)) throw conflict("La decision ya fue registrada; no se cambia su responsable");
      await this.eligibleReviewer(m, row, reviewerId);
      if (row.reviewerId === reviewerId) return this.view(m, actor, row);
      const from = row.reviewerId; row.reviewerId = reviewerId;
      await m.save(row);
      await this.audit(m, actor, "administrative_request.reviewer_assigned", id, { from, to: reviewerId });
      return this.view(m, actor, row);
    });
  }
  async status(actor: Actor, id: string, dto: RequestStatusDto) {
    return this.db.transaction(async m => {
      const row = await this.load(m, actor, id); this.manage(actor, row);
      if (!transitions[row.status].includes(dto.status)) throw conflict("La transicion de estado no esta permitida");
      if (dto.status !== "in_review" && !dto.response?.trim()) throw new ApiError(400, "REQUEST_RESPONSE_REQUIRED", "Registra una respuesta que explique la decision o la ejecucion");
      if (dto.status === "completed" && row.type === "withdrawal") throw conflict("La desvinculacion requiere ejecutar el procedimiento de salida; no basta con cambiar el estado");
      const from = row.status;
      // Asignacion inicial al responsable que inicia la revision; no da permisos exclusivos.
      if (dto.status === "in_review" && !row.reviewerId) row.reviewerId = actor.id;
      if (dto.status === "approved" || dto.status === "rejected") {
        row.reviewedBy = actor.id; row.reviewedAt = new Date().toISOString();
      }
      if (dto.status === "completed") { row.completedBy = actor.id; row.completedAt = new Date().toISOString(); }
      if (dto.response?.trim()) row.response = dto.response.trim();
      row.status = dto.status;
      await m.save(row);
      await this.audit(m, actor, "administrative_request.status_changed", id, { from, to: row.status, response: dto.response?.trim() || null });
      return this.view(m, actor, row);
    });
  }
  async history(actor: Actor, id: string, q: RequestPageQuery) {
    await this.load(this.db.manager, actor, id);
    const [rows, total] = await this.db.manager.findAndCount(AuditEvent, {
      where: { targetType: "administrative_request", targetId: id, action: In(actions) },
      order: { createdAt: "ASC", id: "ASC" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
    });
    const items = await Promise.all(rows.map(async row => ({ id: row.id, action: row.action, createdAt: row.createdAt,
      actor: await this.person(this.db.manager, row.actorUserId), details: row.details ? JSON.parse(row.details) : null })));
    return { items, total, page: q.page, pageSize: q.pageSize };
  }
  private async load(m: EntityManager, actor: Actor, id: string) {
    const row = await m.findOneBy(AdministrativeRequest, { id });
    if (!row || (row.requesterId !== actor.id && !authority(actor))) throw missing();
    return row;
  }
  private manage(actor: Actor, row: AdministrativeRequest) {
    if (!authority(actor) || row.requesterId === actor.id) throw forbidden();
  }
  private async eligibleReviewer(m: EntityManager, row: AdministrativeRequest, id: string) {
    const user = await m.findOne(User, { where: { id }, relations: { roles: true } });
    if (!user || user.accountStatus !== "active" || !authority(user) || row.requesterId === id)
      throw new ApiError(400, "REQUEST_REVIEWER_INVALID", "El responsable debe ser una autoridad activa distinta del solicitante");
  }
  private async person(m: EntityManager, id: string | null) {
    if (!id) return null;
    const user = await m.findOneBy(User, { id });
    return user ? { id: user.id, fullName: user.fullName } : null;
  }
  private async view(m: EntityManager, actor: Actor, r: AdministrativeRequest) {
    const canManage = authority(actor) && actor.id !== r.requesterId;
    const target = r.type === "withdrawal" ? await m.findOne(User, { where: { id: r.requesterId }, relations: { roles: true } }) : null;
    const [requester, reviewer, reviewedBy, completedBy] = await Promise.all([
      this.person(m, r.requesterId), this.person(m, r.reviewerId), this.person(m, r.reviewedBy), this.person(m, r.completedBy),
    ]);
    return { ...r, requester, reviewer, decisionBy: reviewedBy, executionBy: completedBy,
      permissions: { canAssign: canManage && ["pending", "in_review"].includes(r.status),
        canAttach: r.requesterId === actor.id ? ["pending", "in_review"].includes(r.status) : authority(actor) && ["pending", "in_review", "approved"].includes(r.status),
        canWithdraw: canManage && r.type === "withdrawal" && r.status === "approved" && Boolean(target && canManageUser(actorRoles(actor), target.roles.map(role => role.code))),
        allowedTransitions: canManage ? transitions[r.status].filter(s => s !== "completed" || r.type !== "withdrawal") : [] } };
  }
  private audit(m: EntityManager, actor: Actor, action: string, id: string, details: Record<string, unknown>) {
    return recordAudit(m, { actorUserId: actor.id, action, targetType: "administrative_request", targetId: id, details });
  }
}
