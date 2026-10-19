import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { actorRoles, type Actor } from "../projects/project-access";
import { canManageUser } from "../roles/role-policy";
import { User } from "../users/user.entity";
import { deactivateAccount } from "../users/deactivate-account";
import { AdministrativeRequest } from "./administrative-request.entity";
import type { ExecuteWithdrawalDto, RequestPageQuery } from "./administrative-request.dto";

const responsibilities = `SELECT 'project' AS kind, p.id AS id, p.name AS label, p.id AS projectId
 FROM projects p JOIN project_members pm ON pm.project_id = p.id
 WHERE pm.user_id = ? AND pm.role = 'leader' AND p.status NOT IN ('completed','cancelled')
 UNION ALL SELECT 'task', t.id, t.title, t.project_id FROM tasks t JOIN projects p ON p.id = t.project_id
 WHERE t.assignee_id = ? AND t.status != 'done' AND p.status NOT IN ('completed','cancelled')
 UNION ALL SELECT 'event', id, title, project_id FROM events WHERE organizer_id = ? AND status IN ('scheduled','in_progress')
 UNION ALL SELECT 'request', id, subject, NULL FROM administrative_requests WHERE reviewer_id = ? AND status IN ('pending','in_review')`;

@Injectable()
export class WithdrawalService {
  private readonly executing = new Set<string>();
  constructor(@InjectDataSource() private readonly db: DataSource) {}
  private async load(m: EntityManager, actor: Actor, id: string) {
    const request = await m.findOneBy(AdministrativeRequest, { id });
    if (!request || (request.requesterId !== actor.id && !actorRoles(actor).some(r => r === "admin" || r === "coordinator")))
      throw new ApiError(404, "ADMINISTRATIVE_REQUEST_NOT_FOUND", "Solicitud no encontrada");
    const target = await m.findOneOrFail(User, { where: { id: request.requesterId }, relations: { roles: true } });
    if (actor.id === target.id || !canManageUser(actorRoles(actor), target.roles.map(r => r.code)))
      throw new ApiError(403, "USER_NOT_MANAGEABLE", "Otra autoridad con permiso sobre esta cuenta debe ejecutar la salida");
    if (request.type !== "withdrawal" || request.status !== "approved")
      throw new ApiError(409, "WITHDRAWAL_NOT_APPROVED", "La desvinculacion debe estar aprobada antes de ejecutarse");
    return { request, target };
  }
  private async pending(m: EntityManager, userId: string, q: RequestPageQuery) {
    const parameters = [userId, userId, userId, userId];
    const [{ total }] = await m.query(`SELECT count(*) AS total FROM (${responsibilities})`, parameters) as { total: number }[];
    const rows = await m.query(`SELECT * FROM (${responsibilities}) ORDER BY kind,id LIMIT ? OFFSET ?`, [...parameters, q.pageSize, (q.page - 1) * q.pageSize]) as { kind: string; id: string; label: string; projectId: string | null }[];
    return { total, page: q.page, pageSize: q.pageSize, items: rows.map(r => ({ ...r,
      href: r.kind === "project" ? `/hub/proyectos/${r.id}/tareas` : r.kind === "task" ? `/hub/proyectos/${r.projectId}/tareas` : r.kind === "event" ? "/hub/actividades" : `/hub/tramites/${r.id}` })) };
  }
  async preview(actor: Actor, id: string, q: RequestPageQuery) {
    const { target } = await this.load(this.db.manager, actor, id);
    return this.pending(this.db.manager, target.id, q);
  }
  async execute(actor: Actor, id: string, dto: ExecuteWithdrawalDto) {
    if (this.executing.has(id)) throw new ApiError(409, "WITHDRAWAL_IN_PROGRESS", "La desvinculacion ya se esta ejecutando");
    this.executing.add(id);
    try { return await this.db.transaction(async m => {
      const { request, target } = await this.load(m, actor, id);
      if (dto.requesterId !== target.id) throw new ApiError(400, "WITHDRAWAL_CONFIRMATION", "La confirmacion no corresponde al solicitante");
      const pending = await this.pending(m, target.id, { page: 1, pageSize: 20 });
      if (pending.total) throw new ApiError(409, "WITHDRAWAL_RESPONSIBILITIES", "Reasigna explicitamente las responsabilidades pendientes antes de desvincular", pending);
      const now = new Date(), wasInactive = target.accountStatus === "inactive";
      const claimed = await m.update(AdministrativeRequest, { id, status: "approved" }, {
        status: "completed", completedBy: actor.id, completedAt: now.toISOString(), response: dto.response,
      });
      if (claimed.affected !== 1) throw new ApiError(409, "WITHDRAWAL_NOT_APPROVED", "El estado de la solicitud cambio; consulta de nuevo antes de ejecutarla");
      await deactivateAccount(m, actor, target, dto.response, now);
      request.status = "completed"; request.completedBy = actor.id; request.completedAt = now.toISOString(); request.response = dto.response;
      await recordAudit(m, { actorUserId: actor.id, action: "administrative_request.withdrawal_executed", targetType: "administrative_request", targetId: id,
        details: { from: "approved", to: "completed", response: dto.response, requesterId: target.id, wasInactive, sessionsRevoked: true } });
      return { id, status: request.status, completedAt: request.completedAt };
    }); } finally { this.executing.delete(id); }
  }
}
