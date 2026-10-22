import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { type Actor, isProjectEditable, loadManageableProject, loadProjectWithAccess } from "../projects/project-access";
import { canManageProject } from "../projects/project-policy";
import { User } from "../users/user.entity";
import { ProjectObservation } from "./project-observation.entity";
import type { CreateObservationDto, TrackingPageQuery } from "./tracking.dto";

const missing = () => new ApiError(404, "OBSERVATION_NOT_FOUND", "Observacion no encontrada");

/** F6-05: registros cualitativos del proyecto; sin persona evaluada, puntaje ni ranking (DEC-046). */
@Injectable()
export class ObservationsService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async list(actor: Actor, projectId: string, q: TrackingPageQuery) {
    const m = this.db.manager;
    const { project, access } = await loadProjectWithAccess(m, actor, projectId);
    const manageable = canManageProject(access) && isProjectEditable(project);
    const [rows, total] = await m.findAndCount(ProjectObservation, {
      where: { projectId }, order: { createdAt: "DESC", id: "ASC" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize,
    });
    const authors = rows.length ? await m.findBy(User, { id: In([...new Set(rows.map(r => r.authorId))]) }) : [];
    const name = new Map(authors.map(u => [u.id, u.fullName]));
    return {
      items: rows.map(r => ({ id: r.id, kind: r.kind, body: r.body, createdAt: r.createdAt, author: { id: r.authorId, fullName: name.get(r.authorId) ?? null },
        permissions: { canDelete: manageable && (access === "authority" || r.authorId === actor.id) } })),
      total, page: q.page, pageSize: q.pageSize, permissions: { canCreate: manageable },
    };
  }

  async create(actor: Actor, projectId: string, dto: CreateObservationDto) {
    return this.db.transaction(async m => {
      await loadManageableProject(m, actor, projectId);
      const row = await m.save(m.create(ProjectObservation, { projectId, authorId: actor.id, kind: dto.kind, body: dto.body }));
      await recordAudit(m, { actorUserId: actor.id, action: "project_observation.created", targetType: "project", targetId: projectId, details: { observationId: row.id, kind: row.kind } });
      return { id: row.id, kind: row.kind, body: row.body, createdAt: row.createdAt };
    });
  }

  async remove(actor: Actor, projectId: string, id: string) {
    await this.db.transaction(async m => {
      const { access } = await loadManageableProject(m, actor, projectId);
      const row = await m.findOneBy(ProjectObservation, { id, projectId });
      if (!row) throw missing();
      if (access !== "authority" && row.authorId !== actor.id) throw new ApiError(403, "OBSERVATION_FORBIDDEN", "Solo quien la registro o una autoridad puede eliminar la observacion");
      await m.delete(ProjectObservation, { id });
      await recordAudit(m, { actorUserId: actor.id, action: "project_observation.deleted", targetType: "project", targetId: projectId, details: { observationId: id, kind: row.kind, authorId: row.authorId } });
    });
  }
}
