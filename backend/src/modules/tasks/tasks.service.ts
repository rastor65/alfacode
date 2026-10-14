import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import {
  type Actor,
  PROJECT_FORBIDDEN,
  PROJECT_NOT_EDITABLE,
  isProjectEditable,
  loadManageableProject,
  loadProjectWithAccess,
} from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import type { ProjectAccess } from "../projects/project-policy";
import type { Project } from "../projects/project.entity";
import { isCalendarDate, projectProgress } from "../projects/projects.service";
import { FINAL_SPRINT_STATUSES } from "../sprints/sprint-policy";
import { Sprint } from "../sprints/sprint.entity";
import type { CreateTaskDto, ListTasksQuery, UpdateTaskDto } from "./dto/tasks.dto";
import { canChangeTaskStatus, canManageTasks } from "./task-policy";
import { Task } from "./task.entity";

const TASK_NOT_FOUND = () => new ApiError(404, "TASK_NOT_FOUND", "Tarea no encontrada");

/** Campos que solo la autoridad o el lider del proyecto pueden cambiar (F2-09). */
const MANAGED_FIELDS = ["title", "description", "assigneeId", "priority", "dueDate"] as const;

function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function validateDueDate(dueDate: string | null | undefined) {
  if (dueDate && !isCalendarDate(dueDate)) {
    throw new ApiError(400, "VALIDATION_ERROR", "La fecha limite no es valida", [{ field: "dueDate", rules: ["isDate"] }]);
  }
}

@Injectable()
export class TasksService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** F2-10: el backlog son las tareas con `sprint_id IS NULL` (`sprintId=none`). */
  async list(actor: Actor, projectId: string, query: ListTasksQuery) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const builder = manager
      .getRepository(Task)
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.assignee", "assignee")
      .leftJoinAndSelect("task.creator", "creator")
      .where("task.projectId = :projectId", { projectId })
      .addSelect("CASE task.priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END", "priority_rank")
      .orderBy("priority_rank", "ASC")
      .addOrderBy("task.createdAt", "ASC")
      .addOrderBy("task.id", "ASC")
      // Relaciones muchos-a-uno: no duplican filas, asi que basta con OFFSET/LIMIT.
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    if (query.status) {
      builder.andWhere("task.status = :status", { status: query.status });
    }

    if (query.priority) {
      builder.andWhere("task.priority = :priority", { priority: query.priority });
    }

    if (query.assigneeId === "none") {
      builder.andWhere("task.assigneeId IS NULL");
    } else if (query.assigneeId) {
      builder.andWhere("task.assigneeId = :assigneeId", { assigneeId: query.assigneeId });
    }

    if (query.sprintId === "none") {
      builder.andWhere("task.sprintId IS NULL");
    } else if (query.sprintId) {
      builder.andWhere("task.sprintId = :sprintId", { sprintId: query.sprintId });
    }

    if (query.q) {
      builder.andWhere("LOWER(task.title) LIKE :q ESCAPE '\\'", { q: likePattern(query.q) });
    }

    const [tasks, total] = await builder.getManyAndCount();
    const progress = await projectProgress(manager, [projectId]);

    return {
      items: tasks.map((task) => this.taskView(task, project, access, actor)),
      page,
      pageSize,
      total,
      progress: progress.get(projectId)!,
      permissions: { canManageTasks: canManageTasks(access) && isProjectEditable(project) },
    };
  }

  async detail(actor: Actor, projectId: string, taskId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    return this.taskView(await this.findTask(manager, projectId, taskId), project, access, actor);
  }

  async create(actor: Actor, projectId: string, dto: CreateTaskDto) {
    validateDueDate(dto.dueDate);

    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await loadManageableProject(manager, actor, projectId);

      if (dto.assigneeId) {
        await this.assertAssignable(manager, projectId, dto.assigneeId);
      }

      const task = await manager.save(
        manager.create(Task, {
          projectId,
          sprintId: null,
          title: dto.title,
          description: dto.description || null,
          assigneeId: dto.assigneeId ?? null,
          status: dto.status ?? "todo",
          priority: dto.priority ?? "medium",
          dueDate: dto.dueDate ?? null,
          createdBy: actor.id,
        }),
      );

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "task.created",
        targetType: "task",
        targetId: task.id,
        details: { projectId, assigneeId: task.assigneeId, status: task.status, priority: task.priority },
      });

      return this.taskView(await this.findTask(manager, projectId, task.id), project, access, actor);
    });
  }

  /**
   * F2-09: la autoridad o el lider cambian cualquier campo; un colaborador solo el estado de
   * sus tareas. El movimiento en el tablero es este mismo PATCH con `status` (F2-11).
   */
  async update(actor: Actor, projectId: string, taskId: string, dto: UpdateTaskDto) {
    validateDueDate(dto.dueDate);

    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
      const task = await this.findTask(manager, projectId, taskId);
      const touchesManagedFields = MANAGED_FIELDS.some((field) => dto[field] !== undefined);

      if (touchesManagedFields ? !canManageTasks(access) : !canChangeTaskStatus(access, task.assigneeId, actor.id)) {
        throw PROJECT_FORBIDDEN();
      }

      if (!isProjectEditable(project)) {
        throw PROJECT_NOT_EDITABLE();
      }

      const changes: Partial<Task> = {};

      if (dto.title !== undefined && dto.title !== task.title) changes.title = dto.title;
      if (dto.description !== undefined && (dto.description || null) !== task.description) {
        changes.description = dto.description || null;
      }
      if (dto.priority !== undefined && dto.priority !== task.priority) changes.priority = dto.priority;
      if (dto.dueDate !== undefined && dto.dueDate !== task.dueDate) changes.dueDate = dto.dueDate;
      if (dto.status !== undefined && dto.status !== task.status) changes.status = dto.status;
      if (dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId) {
        if (dto.assigneeId !== null) {
          await this.assertAssignable(manager, projectId, dto.assigneeId);
        }
        changes.assigneeId = dto.assigneeId;
      }

      // Reabrir una tarea de un sprint finalizado la devuelve al backlog: el historial del sprint
      // queda en su registro de cierre y la tarea puede planificarse de nuevo.
      if (changes.status !== undefined && changes.status !== "done" && task.sprintId) {
        const sprint = await manager.findOneBy(Sprint, { id: task.sprintId });

        if (sprint && FINAL_SPRINT_STATUSES.includes(sprint.status)) {
          changes.sprintId = null;
        }
      }

      if (Object.keys(changes).length > 0) {
        await manager.update(Task, { id: taskId }, changes);
        await this.auditChanges(manager, actor, task, changes);
      }

      return this.taskView(await this.findTask(manager, projectId, taskId), project, access, actor);
    });
  }

  /** F2-21: movimientos de estado y asignaciones tienen su propio evento; el resto, uno comun. */
  private async auditChanges(manager: EntityManager, actor: Actor, task: Task, changes: Partial<Task>) {
    const base = { actorUserId: actor.id, targetType: "task", targetId: task.id };

    if (changes.status !== undefined) {
      await recordAudit(manager, {
        ...base,
        action: "task.status_changed",
        details: { projectId: task.projectId, from: task.status, to: changes.status },
      });
    }

    if (changes.assigneeId !== undefined) {
      await recordAudit(manager, {
        ...base,
        action: "task.assignee_changed",
        details: { projectId: task.projectId, from: task.assigneeId, to: changes.assigneeId },
      });
    }

    if (changes.sprintId !== undefined) {
      await recordAudit(manager, {
        ...base,
        action: "task.sprint_changed",
        details: { projectId: task.projectId, from: task.sprintId, to: changes.sprintId, reason: "reopened" },
      });
    }

    const fields = Object.keys(changes).filter((field) => !["status", "assigneeId", "sprintId"].includes(field));

    if (fields.length > 0) {
      await recordAudit(manager, { ...base, action: "task.updated", details: { projectId: task.projectId, fields } });
    }
  }

  /** La tarea debe ser del proyecto de la URL; si no, se trata como inexistente (contrato F2). */
  private async findTask(manager: EntityManager, projectId: string, taskId: string) {
    const task = await manager.findOne(Task, {
      where: { id: taskId, projectId },
      relations: { assignee: true, creator: true },
    });

    if (!task) {
      throw TASK_NOT_FOUND();
    }

    return task;
  }

  /** F2-08: la persona responsable es miembro del proyecto con la cuenta activa. */
  private async assertAssignable(manager: EntityManager, projectId: string, userId: string) {
    const member = await manager.findOne(ProjectMember, { where: { projectId, userId }, relations: { user: true } });

    if (!member || member.user.accountStatus !== "active") {
      throw new ApiError(409, "ASSIGNEE_NOT_PROJECT_MEMBER", "La persona responsable debe ser integrante activo del proyecto");
    }
  }

  private taskView(task: Task, project: Project, access: ProjectAccess, actor: Actor) {
    const editable = isProjectEditable(project);

    return {
      id: task.id,
      projectId: task.projectId,
      sprintId: task.sprintId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee ? { userId: task.assignee.id, fullName: task.assignee.fullName } : null,
      createdBy: task.creator ? { userId: task.creator.id, fullName: task.creator.fullName } : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      // Ayuda a la interfaz; el backend vuelve a comprobar cada accion.
      permissions: {
        canEdit: editable && canManageTasks(access),
        canChangeStatus: editable && canChangeTaskStatus(access, task.assigneeId, actor.id),
      },
    };
  }
}
