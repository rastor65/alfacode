import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { type Actor, actorRoles } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { isAuthority } from "../roles/role-policy";
import { User } from "../users/user.entity";
import type { CreateResearchLineDto, ListResearchLinesQuery, UpdateResearchLineDto } from "./dto/research.dto";
import { canManageResearchLines, normalizeLineName } from "./research-policy";
import { ProjectResearchLine, ResearchLine } from "./research.entities";

export const RESEARCH_LINE_NOT_FOUND = () => new ApiError(404, "RESEARCH_LINE_NOT_FOUND", "Linea de investigacion no encontrada");
const RESEARCH_LINES_FORBIDDEN = () =>
  new ApiError(403, "RESEARCH_LINES_FORBIDDEN", "Solo la coordinacion gestiona las lineas de investigacion");
const RESEARCH_LINE_NAME_TAKEN = () =>
  new ApiError(409, "RESEARCH_LINE_NAME_TAKEN", "Ya existe una linea de investigacion con ese nombre", [
    { field: "name", rules: ["unique"] },
  ]);

function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

@Injectable()
export class ResearchLinesService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async list(actor: Actor, query: ListResearchLinesQuery) {
    const manager = this.dataSource.manager;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const builder = manager
      .getRepository(ResearchLine)
      .createQueryBuilder("line")
      .leftJoinAndSelect("line.responsible", "responsible")
      .orderBy("line.status", "ASC")
      .addOrderBy("line.nameNormalized", "ASC")
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    if (query.status) {
      builder.andWhere("line.status = :status", { status: query.status });
    }

    if (query.q) {
      builder.andWhere("line.nameNormalized LIKE :q ESCAPE '\\'", { q: likePattern(normalizeLineName(query.q)) });
    }

    const [lines, total] = await builder.getManyAndCount();
    const counts = await this.projectCounts(manager, lines.map((line) => line.id));

    return {
      items: lines.map((line) => this.lineView(line, actor, counts.get(line.id) ?? 0)),
      page,
      pageSize,
      total,
      permissions: { canManageLines: canManageResearchLines(actorRoles(actor)) },
    };
  }

  /** Detalle con los proyectos asociados que la persona puede ver; el total incluye los demas. */
  async detail(actor: Actor, id: string) {
    const manager = this.dataSource.manager;
    const line = await this.findLine(manager, id);
    const builder = manager
      .getRepository(Project)
      .createQueryBuilder("project")
      .innerJoin(ProjectResearchLine, "link", "link.project_id = project.id AND link.research_line_id = :id", { id })
      .orderBy("project.name", "ASC");

    if (!isAuthority(actorRoles(actor))) {
      builder.innerJoin(ProjectMember, "member", "member.project_id = project.id AND member.user_id = :userId", {
        userId: actor.id,
      });
    }

    const projects = await builder.getMany();
    const total = (await this.projectCounts(manager, [id])).get(id) ?? 0;

    return {
      ...this.lineView(line, actor, total),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        type: project.type,
        status: project.status,
      })),
    };
  }

  async create(actor: Actor, dto: CreateResearchLineDto) {
    this.assertCanManage(actor);

    return this.dataSource.transaction(async (manager) => {
      const nameNormalized = normalizeLineName(dto.name);
      await this.assertNameAvailable(manager, nameNormalized);

      if (dto.responsibleUserId) {
        await this.assertResponsible(manager, dto.responsibleUserId);
      }

      const line = await manager.save(
        manager.create(ResearchLine, {
          name: dto.name,
          nameNormalized,
          description: dto.description || null,
          objectives: dto.objectives || null,
          responsibleUserId: dto.responsibleUserId ?? null,
          status: "active",
          createdBy: actor.id,
        }),
      );

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "research_line.created",
        targetType: "research_line",
        targetId: line.id,
        details: { name: line.name, responsibleUserId: line.responsibleUserId },
      });

      return this.lineView(await this.findLine(manager, line.id), actor, 0);
    });
  }

  async update(actor: Actor, id: string, dto: UpdateResearchLineDto) {
    this.assertCanManage(actor);

    return this.dataSource.transaction(async (manager) => {
      const line = await this.findLine(manager, id);
      const changes: Partial<ResearchLine> = {};

      if (dto.name !== undefined && dto.name !== line.name) {
        const nameNormalized = normalizeLineName(dto.name);

        if (nameNormalized !== line.nameNormalized) {
          await this.assertNameAvailable(manager, nameNormalized);
        }

        changes.name = dto.name;
        changes.nameNormalized = nameNormalized;
      }

      if (dto.description !== undefined && (dto.description || null) !== line.description) {
        changes.description = dto.description || null;
      }

      if (dto.objectives !== undefined && (dto.objectives || null) !== line.objectives) {
        changes.objectives = dto.objectives || null;
      }

      if (dto.responsibleUserId !== undefined && dto.responsibleUserId !== line.responsibleUserId) {
        if (dto.responsibleUserId !== null) {
          await this.assertResponsible(manager, dto.responsibleUserId);
        }
        changes.responsibleUserId = dto.responsibleUserId;
      }

      if (dto.status !== undefined && dto.status !== line.status) {
        changes.status = dto.status;
      }

      if (Object.keys(changes).length > 0) {
        await manager.update(ResearchLine, { id }, changes);
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: changes.status ? "research_line.status_changed" : "research_line.updated",
          targetType: "research_line",
          targetId: id,
          details: {
            fields: Object.keys(changes).filter((field) => field !== "nameNormalized"),
            ...(changes.status ? { from: line.status, to: changes.status } : {}),
          },
        });
      }

      const count = (await this.projectCounts(manager, [id])).get(id) ?? 0;
      return this.lineView(await this.findLine(manager, id), actor, count);
    });
  }

  /** Solo se elimina una linea sin proyectos; si ya se uso, se desactiva para conservar el historial. */
  async remove(actor: Actor, id: string) {
    this.assertCanManage(actor);

    await this.dataSource.transaction(async (manager) => {
      const line = await this.findLine(manager, id);

      if (await manager.existsBy(ProjectResearchLine, { researchLineId: id })) {
        throw new ApiError(
          409,
          "RESEARCH_LINE_IN_USE",
          "La linea tiene proyectos asociados; desactivala en lugar de eliminarla",
        );
      }

      await manager.delete(ResearchLine, { id });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "research_line.deleted",
        targetType: "research_line",
        targetId: id,
        details: { name: line.name },
      });
    });
  }

  private assertCanManage(actor: Actor) {
    if (!canManageResearchLines(actorRoles(actor))) {
      throw RESEARCH_LINES_FORBIDDEN();
    }
  }

  private async assertNameAvailable(manager: EntityManager, nameNormalized: string) {
    if (await manager.existsBy(ResearchLine, { nameNormalized })) {
      throw RESEARCH_LINE_NAME_TAKEN();
    }
  }

  private async assertResponsible(manager: EntityManager, userId: string) {
    const user = await manager.findOneBy(User, { id: userId });

    if (!user || user.accountStatus !== "active") {
      throw new ApiError(409, "RESPONSIBLE_NOT_ACTIVE", "La persona responsable debe ser un integrante activo", [
        { field: "responsibleUserId", rules: ["activeUser"] },
      ]);
    }
  }

  private async findLine(manager: EntityManager, id: string) {
    const line = await manager.findOne(ResearchLine, { where: { id }, relations: { responsible: true } });

    if (!line) {
      throw RESEARCH_LINE_NOT_FOUND();
    }

    return line;
  }

  private async projectCounts(manager: EntityManager, lineIds: string[]) {
    const counts = new Map<string, number>();

    if (lineIds.length === 0) {
      return counts;
    }

    const rows = await manager
      .getRepository(ProjectResearchLine)
      .createQueryBuilder("link")
      .select("link.research_line_id", "lineId")
      .addSelect("COUNT(*)", "count")
      .where("link.research_line_id IN (:...lineIds)", { lineIds })
      .groupBy("link.research_line_id")
      .getRawMany<{ lineId: string; count: number | string }>();

    for (const row of rows) {
      counts.set(row.lineId, Number(row.count));
    }

    return counts;
  }

  private lineView(line: ResearchLine, actor: Actor, projectCount: number) {
    const canManage = canManageResearchLines(actorRoles(actor));

    return {
      id: line.id,
      name: line.name,
      description: line.description,
      objectives: line.objectives,
      status: line.status,
      responsible: line.responsible ? { userId: line.responsible.id, fullName: line.responsible.fullName } : null,
      projectCount,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
      // Ayuda a la interfaz; el backend vuelve a comprobar cada accion.
      permissions: { canEdit: canManage, canDelete: canManage && projectCount === 0 },
    };
  }
}
