import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import {
  type Actor,
  PROJECT_FORBIDDEN,
  PROJECT_NOT_EDITABLE,
  isProjectEditable,
  loadProjectWithAccess,
} from "../projects/project-access";
import { DocumentRecord } from "../documents/document.entity";
import { ProjectMember } from "../projects/project-member.entity";
import type { ProjectAccess } from "../projects/project-policy";
import type { Project } from "../projects/project.entity";
import { isCalendarDate } from "../projects/projects.service";
import { User } from "../users/user.entity";
import type {
  CreateResearchResultDto,
  LinkResearchLineDto,
  SaveResearchProfileDto,
  UpdateResearchResultDto,
} from "./dto/research.dto";
import { RESEARCH_LINE_NOT_FOUND } from "./research-lines.service";
import { canManageProjectResearch } from "./research-policy";
import { ProjectResearchLine, ProjectResearchProfile, ResearchLine, ResearchResult } from "./research.entities";

const RESEARCH_RESULT_NOT_FOUND = () => new ApiError(404, "RESEARCH_RESULT_NOT_FOUND", "Resultado no encontrado");

const PROFILE_FIELDS = ["problem", "question", "justification", "methodology", "notes"] as const;

function validateResultDate(value: string | null | undefined) {
  if (value && !isCalendarDate(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "La fecha del resultado no es valida", [{ field: "resultDate", rules: ["isDate"] }]);
  }
}

@Injectable()
export class ProjectResearchService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------- F3-02: lineas asociadas

  async lines(actor: Actor, projectId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    return this.linesView(manager, project, access);
  }

  async linkLine(actor: Actor, projectId: string, dto: LinkResearchLineDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, projectId);
      const line = await manager.findOneBy(ResearchLine, { id: dto.researchLineId });

      if (!line) {
        throw RESEARCH_LINE_NOT_FOUND();
      }

      if (line.status !== "active") {
        throw new ApiError(409, "RESEARCH_LINE_INACTIVE", "La linea de investigacion esta inactiva");
      }

      if (await manager.existsBy(ProjectResearchLine, { projectId, researchLineId: line.id })) {
        throw new ApiError(409, "RESEARCH_LINE_ALREADY_LINKED", "La linea ya esta asociada al proyecto");
      }

      await manager.insert(ProjectResearchLine, { projectId, researchLineId: line.id, createdBy: actor.id });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.research_line_linked",
        targetType: "project",
        targetId: projectId,
        details: { researchLineId: line.id },
      });

      return this.linesView(manager, project, access);
    });
  }

  async unlinkLine(actor: Actor, projectId: string, researchLineId: string) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, projectId);
      const result = await manager.delete(ProjectResearchLine, { projectId, researchLineId });

      if (!result.affected) {
        throw RESEARCH_LINE_NOT_FOUND();
      }

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.research_line_unlinked",
        targetType: "project",
        targetId: projectId,
        details: { researchLineId },
      });

      return this.linesView(manager, project, access);
    });
  }

  // ---------------------------------------------------------------- F3-03: ficha investigativa

  /** La ficha es opcional: si no existe se responde `profile: null`, no un error. */
  async profile(actor: Actor, projectId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    return this.profileView(manager, project, access);
  }

  /** Crea o reemplaza la ficha del proyecto (una sola por proyecto). */
  async saveProfile(actor: Actor, projectId: string, dto: SaveResearchProfileDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, projectId);
      const existing = await manager.findOneBy(ProjectResearchProfile, { projectId });
      const values = Object.fromEntries(PROFILE_FIELDS.map((field) => [field, dto[field] || null])) as Pick<
        ProjectResearchProfile,
        (typeof PROFILE_FIELDS)[number]
      >;

      if (existing) {
        await manager.update(ProjectResearchProfile, { projectId }, { ...values, updatedBy: actor.id });
      } else {
        await manager.insert(ProjectResearchProfile, { projectId, ...values, updatedBy: actor.id });
      }

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: existing ? "project.research_profile_updated" : "project.research_profile_created",
        targetType: "project",
        targetId: projectId,
        details: {
          fields: PROFILE_FIELDS.filter((field) => values[field] !== (existing ? existing[field] : null)),
        },
      });

      return this.profileView(manager, project, access);
    });
  }

  // ---------------------------------------------------------------- F3-04: resultados

  async results(actor: Actor, projectId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    const results = await manager.find(ResearchResult, {
      where: { projectId },
      relations: { participants: true, creator: true },
      order: { createdAt: "DESC", id: "ASC" },
    });

    return {
      items: results.map((result) => this.resultView(result, project, access)),
      permissions: { canManageResults: this.canManage(project, access) },
    };
  }

  async result(actor: Actor, projectId: string, resultId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    return this.resultView(await this.findResult(manager, projectId, resultId), project, access);
  }

  async createResult(actor: Actor, projectId: string, dto: CreateResearchResultDto) {
    validateResultDate(dto.resultDate);

    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, projectId);
      const participants = await this.participants(manager, projectId, dto.participantIds ?? [], []);
      const result = await manager.save(
        manager.create(ResearchResult, {
          projectId,
          title: dto.title,
          description: dto.description || null,
          type: dto.type ?? "finding",
          resultDate: dto.resultDate ?? null,
          references: dto.references || null,
          participants,
          createdBy: actor.id,
        }),
      );

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "research_result.created",
        targetType: "research_result",
        targetId: result.id,
        details: { projectId, type: result.type, participantIds: participants.map((user) => user.id) },
      });

      return this.resultView(await this.findResult(manager, projectId, result.id), project, access);
    });
  }

  async updateResult(actor: Actor, projectId: string, resultId: string, dto: UpdateResearchResultDto) {
    validateResultDate(dto.resultDate);

    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, projectId);
      const result = await this.findResult(manager, projectId, resultId);
      const fields: string[] = [];

      if (dto.title !== undefined && dto.title !== result.title) {
        result.title = dto.title;
        fields.push("title");
      }
      if (dto.description !== undefined && (dto.description || null) !== result.description) {
        result.description = dto.description || null;
        fields.push("description");
      }
      if (dto.type !== undefined && dto.type !== result.type) {
        result.type = dto.type;
        fields.push("type");
      }
      if (dto.resultDate !== undefined && dto.resultDate !== result.resultDate) {
        result.resultDate = dto.resultDate;
        fields.push("resultDate");
      }
      if (dto.references !== undefined && (dto.references || null) !== result.references) {
        result.references = dto.references || null;
        fields.push("references");
      }

      const previousIds = result.participants.map((user) => user.id);

      if (dto.participantIds !== undefined) {
        const next = [...dto.participantIds].sort();

        if (next.join() !== [...previousIds].sort().join()) {
          result.participants = await this.participants(manager, projectId, dto.participantIds, previousIds);
          fields.push("participants");
        }
      }

      if (fields.length > 0) {
        await manager.save(result);
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "research_result.updated",
          targetType: "research_result",
          targetId: resultId,
          details: {
            projectId,
            fields,
            ...(fields.includes("participants")
              ? { participantIds: { from: previousIds, to: result.participants.map((user) => user.id) } }
              : {}),
          },
        });
      }

      return this.resultView(await this.findResult(manager, projectId, resultId), project, access);
    });
  }

  async removeResult(actor: Actor, projectId: string, resultId: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.loadManageable(manager, actor, projectId);
      const result = await this.findResult(manager, projectId, resultId);

      // Los documentos vinculados siguen en el proyecto, sin el resultado (DEC-030).
      await manager.update(DocumentRecord, { researchResultId: resultId }, { researchResultId: null });
      await manager.delete(ResearchResult, { id: resultId });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "research_result.deleted",
        targetType: "research_result",
        targetId: resultId,
        details: { projectId, title: result.title },
      });
    });
  }

  // ---------------------------------------------------------------- comun

  private canManage(project: Project, access: ProjectAccess) {
    return canManageProjectResearch(access) && isProjectEditable(project);
  }

  private async loadManageable(manager: EntityManager, actor: Actor, projectId: string) {
    const loaded = await loadProjectWithAccess(manager, actor, projectId);

    if (!canManageProjectResearch(loaded.access)) {
      throw PROJECT_FORBIDDEN();
    }

    if (!isProjectEditable(loaded.project)) {
      throw PROJECT_NOT_EDITABLE();
    }

    return loaded;
  }

  /**
   * Participantes de un resultado: integrantes del proyecto. Quien ya figuraba puede conservarse
   * aunque haya salido del equipo, para no reescribir la autoria de un resultado anterior.
   */
  private async participants(manager: EntityManager, projectId: string, ids: string[], keepIds: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const members = await manager.findBy(ProjectMember, { projectId, userId: In(ids) });
    const allowed = new Set([...members.map((member) => member.userId), ...keepIds]);

    if (ids.some((id) => !allowed.has(id))) {
      throw new ApiError(409, "PARTICIPANT_NOT_PROJECT_MEMBER", "Los participantes deben ser integrantes del proyecto", [
        { field: "participantIds", rules: ["projectMember"] },
      ]);
    }

    return manager.findBy(User, { id: In(ids) });
  }

  /** El resultado debe ser del proyecto de la URL; si no, se trata como inexistente. */
  private async findResult(manager: EntityManager, projectId: string, resultId: string) {
    const result = await manager.findOne(ResearchResult, {
      where: { id: resultId, projectId },
      relations: { participants: true, creator: true },
    });

    if (!result) {
      throw RESEARCH_RESULT_NOT_FOUND();
    }

    return result;
  }

  private async linesView(manager: EntityManager, project: Project, access: ProjectAccess) {
    const links = await manager.find(ProjectResearchLine, {
      where: { projectId: project.id },
      relations: { researchLine: true },
      // Por nombre: estable aunque varias se asocien en el mismo segundo.
      order: { researchLine: { nameNormalized: "ASC" } },
    });

    return {
      items: links.map((link) => ({
        id: link.researchLine.id,
        name: link.researchLine.name,
        status: link.researchLine.status,
        linkedAt: link.createdAt,
      })),
      permissions: { canManageLines: this.canManage(project, access) },
    };
  }

  private async profileView(manager: EntityManager, project: Project, access: ProjectAccess) {
    const profile = await manager.findOne(ProjectResearchProfile, {
      where: { projectId: project.id },
      relations: { editor: true },
    });

    return {
      profile: profile
        ? {
            ...Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field]])),
            updatedAt: profile.updatedAt,
            updatedBy: profile.editor ? { userId: profile.editor.id, fullName: profile.editor.fullName } : null,
          }
        : null,
      permissions: { canEdit: this.canManage(project, access) },
    };
  }

  private resultView(result: ResearchResult, project: Project, access: ProjectAccess) {
    const canManage = this.canManage(project, access);

    return {
      id: result.id,
      projectId: result.projectId,
      title: result.title,
      description: result.description,
      type: result.type,
      resultDate: result.resultDate,
      references: result.references,
      participants: [...result.participants]
        .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"))
        .map((user) => ({ userId: user.id, fullName: user.fullName })),
      createdBy: result.creator ? { userId: result.creator.id, fullName: result.creator.fullName } : null,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      permissions: { canEdit: canManage, canDelete: canManage },
    };
  }
}
