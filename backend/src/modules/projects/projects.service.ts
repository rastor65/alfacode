import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import type { RoleCode } from "../roles/role.entity";
import { User } from "../users/user.entity";
import type {
  AddProjectMemberDto,
  ChangeProjectStatusDto,
  CreateProjectDto,
  ListProjectsQuery,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from "./dto/projects.dto";
import { ProjectMember } from "./project-member.entity";
import {
  FINAL_PROJECT_STATUSES,
  type ProjectAccess,
  allowedProjectTransitions,
  canCreateProject,
  canManageProject,
  canTransitionProject,
  projectAccess,
} from "./project-policy";
import { Project, type ProjectStatus } from "./project.entity";

type Actor = Pick<User, "id"> & { roles?: { code: RoleCode }[] };

/** Estados en los que un proyecto debe conservar al menos un lider activo (F2-04). */
const LEADER_REQUIRED_STATUSES: ProjectStatus[] = ["active", "paused"];

const NOT_FOUND = () => new ApiError(404, "PROJECT_NOT_FOUND", "Proyecto no encontrado");
const FORBIDDEN = () => new ApiError(403, "PROJECT_FORBIDDEN", "No tienes permiso para esta accion en el proyecto");

function actorRoles(actor: Actor): RoleCode[] {
  return (actor.roles ?? []).map((role) => role.code);
}

/** Fecha de calendario real (`2026-02-30` no lo es). */
export function isCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function validateDates(startDate: string | null, endDate: string | null) {
  const invalid = [
    ...(startDate && !isCalendarDate(startDate) ? [{ field: "startDate", rules: ["isDate"] }] : []),
    ...(endDate && !isCalendarDate(endDate) ? [{ field: "endDate", rules: ["isDate"] }] : []),
  ];

  if (invalid.length === 0 && startDate && endDate && endDate < startDate) {
    invalid.push({ field: "endDate", rules: ["afterStartDate"] });
  }

  if (invalid.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Las fechas del proyecto no son validas", invalid);
  }
}

function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function memberView(member: ProjectMember, includeEmail: boolean) {
  return {
    userId: member.userId,
    fullName: member.user.fullName,
    ...(includeEmail ? { email: member.user.emailNormalized } : {}),
    accountStatus: member.user.accountStatus,
    role: member.role,
    addedAt: member.createdAt,
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async list(actor: Actor, query: ListProjectsQuery) {
    const roles = actorRoles(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const builder = this.dataSource
      .getRepository(Project)
      .createQueryBuilder("project")
      .orderBy("project.updatedAt", "DESC")
      .addOrderBy("project.id", "ASC")
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // F2-05: las autoridades ven todos; el resto, solo los proyectos donde participa.
    if (projectAccess(roles, null) !== "authority") {
      builder.innerJoin(ProjectMember, "mine", "mine.project_id = project.id AND mine.user_id = :actorId", {
        actorId: actor.id,
      });
    }

    if (query.status) {
      builder.andWhere("project.status = :status", { status: query.status });
    }

    if (query.methodology) {
      builder.andWhere("project.methodology = :methodology", { methodology: query.methodology });
    }

    if (query.q) {
      builder.andWhere("LOWER(project.name) LIKE :q ESCAPE '\\'", { q: likePattern(query.q) });
    }

    const [projects, total] = await builder.getManyAndCount();
    const members = projects.length
      ? await this.dataSource.getRepository(ProjectMember).find({
          where: { projectId: In(projects.map((project) => project.id)) },
          relations: { user: true },
        })
      : [];

    return {
      items: projects.map((project) => {
        const team = members.filter((member) => member.projectId === project.id);
        return {
          ...this.projectView(project),
          myRole: team.find((member) => member.userId === actor.id)?.role ?? null,
          memberCount: team.length,
          leaders: team
            .filter((member) => member.role === "leader")
            .map((member) => ({ userId: member.userId, fullName: member.user.fullName })),
        };
      }),
      page,
      pageSize,
      total,
    };
  }

  async detail(actor: Actor, id: string) {
    const { project, access } = await this.loadWithAccess(this.dataSource.manager, actor, id);
    return this.detailView(this.dataSource.manager, project, access, actor);
  }

  async create(actor: Actor, dto: CreateProjectDto) {
    if (!canCreateProject(actorRoles(actor))) {
      throw new ApiError(403, "FORBIDDEN", "Solo la administracion y la coordinacion crean proyectos");
    }

    validateDates(dto.startDate ?? null, dto.endDate ?? null);

    return this.dataSource.transaction(async (manager) => {
      const project = await manager.save(
        manager.create(Project, {
          name: dto.name,
          description: dto.description || null,
          type: dto.type,
          methodology: dto.methodology,
          status: "proposed",
          createdBy: actor.id,
          startDate: dto.startDate ?? null,
          endDate: dto.endDate ?? null,
        }),
      );

      const joinAsLeader = dto.joinAsLeader !== false;

      if (joinAsLeader) {
        await manager.save(
          manager.create(ProjectMember, { projectId: project.id, userId: actor.id, role: "leader", addedBy: actor.id }),
        );
      }

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.created",
        targetType: "project",
        targetId: project.id,
        details: { methodology: project.methodology, type: project.type, creatorJoinedAsLeader: joinAsLeader },
      });

      return this.detailView(manager, project, "authority", actor);
    });
  }

  async update(actor: Actor, id: string, dto: UpdateProjectDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, id);
      const changes: Partial<Project> = {};

      if (dto.name !== undefined) changes.name = dto.name;
      if (dto.description !== undefined) changes.description = dto.description || null;
      if (dto.type !== undefined) changes.type = dto.type;
      if (dto.startDate !== undefined) changes.startDate = dto.startDate;
      if (dto.endDate !== undefined) changes.endDate = dto.endDate;

      validateDates(
        changes.startDate !== undefined ? changes.startDate : project.startDate,
        changes.endDate !== undefined ? changes.endDate : project.endDate,
      );

      const changedFields = Object.keys(changes);

      if (changedFields.length > 0) {
        await manager.update(Project, { id }, changes);
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "project.updated",
          targetType: "project",
          targetId: id,
          details: { fields: changedFields },
        });
      }

      return this.detailView(manager, await manager.findOneByOrFail(Project, { id }), access, actor);
    });
  }

  /** F2-02: transiciones explicitas; activar exige un lider activo (F2-03). */
  async changeStatus(actor: Actor, id: string, dto: ChangeProjectStatusDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadWithAccess(manager, actor, id);

      if (!canManageProject(access)) {
        throw FORBIDDEN();
      }

      if (!canTransitionProject(project.status, dto.status)) {
        throw new ApiError(
          409,
          "INVALID_PROJECT_STATUS_TRANSITION",
          FINAL_PROJECT_STATUSES.includes(project.status)
            ? "Un proyecto finalizado o cancelado no se puede reactivar"
            : `No se puede pasar de ${project.status} a ${dto.status}`,
        );
      }

      if (LEADER_REQUIRED_STATUSES.includes(dto.status) && (await this.activeLeaderCount(manager, id)) === 0) {
        throw new ApiError(409, "PROJECT_LEADER_REQUIRED", "Asigna un lider activo antes de activar el proyecto");
      }

      await manager.update(Project, { id }, { status: dto.status });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.status_changed",
        targetType: "project",
        targetId: id,
        details: { from: project.status, to: dto.status, reason: dto.reason || null },
      });

      return this.detailView(manager, await manager.findOneByOrFail(Project, { id }), access, actor);
    });
  }

  async members(actor: Actor, id: string) {
    const { access } = await this.loadWithAccess(this.dataSource.manager, actor, id);
    const members = await this.dataSource.getRepository(ProjectMember).find({
      where: { projectId: id },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    return members.map((member) => memberView(member, access === "authority"));
  }

  async addMember(actor: Actor, id: string, dto: AddProjectMemberDto) {
    return this.dataSource.transaction(async (manager) => {
      const { access } = await this.loadManageable(manager, actor, id);
      const user = await manager.findOneBy(User, { id: dto.userId });

      if (!user) {
        throw new ApiError(404, "USER_NOT_FOUND", "Integrante no encontrado");
      }

      // F2-04: solo integrantes activos del semillero.
      if (user.accountStatus !== "active") {
        throw new ApiError(409, "USER_NOT_ACTIVE", "Solo se agregan integrantes activos");
      }

      if (await manager.existsBy(ProjectMember, { projectId: id, userId: dto.userId })) {
        throw new ApiError(409, "MEMBER_ALREADY_EXISTS", "La persona ya pertenece al proyecto");
      }

      await manager.save(manager.create(ProjectMember, { projectId: id, userId: dto.userId, role: dto.role, addedBy: actor.id }));
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.member_added",
        targetType: "project",
        targetId: id,
        details: { userId: dto.userId, role: dto.role },
      });

      return this.membersWith(manager, id, access);
    });
  }

  async updateMember(actor: Actor, id: string, userId: string, dto: UpdateProjectMemberDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, id);
      const member = await this.findMember(manager, id, userId);

      if (member.role === dto.role) {
        return this.membersWith(manager, id, access);
      }

      if (member.role === "leader") {
        await this.assertKeepsLeader(manager, project, userId);
      }

      await manager.update(ProjectMember, { projectId: id, userId }, { role: dto.role });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.member_role_changed",
        targetType: "project",
        targetId: id,
        details: { userId, from: member.role, to: dto.role },
      });

      return this.membersWith(manager, id, access);
    });
  }

  async removeMember(actor: Actor, id: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadManageable(manager, actor, id);
      const member = await this.findMember(manager, id, userId);

      if (member.role === "leader") {
        await this.assertKeepsLeader(manager, project, userId);
      }

      // Cuando existan tareas (I-11) se exigira reasignarlas antes de retirar a la persona (F2-04).
      await manager.delete(ProjectMember, { projectId: id, userId });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "project.member_removed",
        targetType: "project",
        targetId: id,
        details: { userId, role: member.role },
      });

      return this.membersWith(manager, id, access);
    });
  }

  /** Carga el proyecto y el nivel de acceso; sin acceso responde 404 para no revelar que existe. */
  private async loadWithAccess(manager: EntityManager, actor: Actor, id: string) {
    const project = await manager.findOneBy(Project, { id });

    if (!project) {
      throw NOT_FOUND();
    }

    const membership = await manager.findOneBy(ProjectMember, { projectId: id, userId: actor.id });
    const access = projectAccess(actorRoles(actor), membership?.role ?? null);

    if (access === "none") {
      throw NOT_FOUND();
    }

    return { project, access };
  }

  private async loadManageable(manager: EntityManager, actor: Actor, id: string) {
    const loaded = await this.loadWithAccess(manager, actor, id);

    if (!canManageProject(loaded.access)) {
      throw FORBIDDEN();
    }

    if (FINAL_PROJECT_STATUSES.includes(loaded.project.status)) {
      throw new ApiError(409, "PROJECT_NOT_EDITABLE", "El proyecto esta finalizado o cancelado y no admite cambios");
    }

    return loaded;
  }

  private async findMember(manager: EntityManager, projectId: string, userId: string) {
    const member = await manager.findOneBy(ProjectMember, { projectId, userId });

    if (!member) {
      throw new ApiError(404, "MEMBER_NOT_FOUND", "La persona no pertenece al proyecto");
    }

    return member;
  }

  private activeLeaderCount(manager: EntityManager, projectId: string, excludingUserId?: string) {
    const builder = manager
      .getRepository(ProjectMember)
      .createQueryBuilder("member")
      .innerJoin("member.user", "user")
      .where("member.projectId = :projectId", { projectId })
      .andWhere("member.role = 'leader'")
      .andWhere("user.accountStatus = 'active'");

    if (excludingUserId) {
      builder.andWhere("member.userId != :excludingUserId", { excludingUserId });
    }

    return builder.getCount();
  }

  /** F2-04: un proyecto activo (o pausado) conserva al menos un lider activo. */
  private async assertKeepsLeader(manager: EntityManager, project: Project, leavingUserId: string) {
    if (
      LEADER_REQUIRED_STATUSES.includes(project.status) &&
      (await this.activeLeaderCount(manager, project.id, leavingUserId)) === 0
    ) {
      throw new ApiError(409, "PROJECT_LEADER_REQUIRED", "El proyecto debe conservar al menos un lider activo");
    }
  }

  private async membersWith(manager: EntityManager, projectId: string, access: ProjectAccess) {
    const members = await manager.find(ProjectMember, {
      where: { projectId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    return members.map((member) => memberView(member, access === "authority"));
  }

  private projectView(project: Project) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      methodology: project.methodology,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private async detailView(manager: EntityManager, project: Project, access: ProjectAccess, actor: Actor) {
    const members = await this.membersWith(manager, project.id, access);
    const manageable = canManageProject(access);
    const editable = !FINAL_PROJECT_STATUSES.includes(project.status);

    return {
      ...this.projectView(project),
      members,
      myRole: members.find((member) => member.userId === actor.id)?.role ?? null,
      // Ayuda a la interfaz a mostrar solo acciones validas; el backend vuelve a comprobarlas.
      permissions: {
        canEdit: manageable && editable,
        canManageMembers: manageable && editable,
        allowedTransitions: manageable ? allowedProjectTransitions(project.status) : [],
      },
    };
  }
}
