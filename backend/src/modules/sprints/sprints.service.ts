import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In, QueryFailedError } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import {
  type Actor,
  isProjectEditable,
  loadManageableProject,
  loadProjectWithAccess,
} from "../projects/project-access";
import { type ProjectAccess, canManageProject } from "../projects/project-policy";
import type { Project } from "../projects/project.entity";
import { isCalendarDate } from "../projects/projects.service";
import { TASK_STATUSES, Task, type TaskStatus } from "../tasks/task.entity";
import type { AddSprintTasksDto, CancelSprintDto, CreateSprintDto, UpdateSprintDto } from "./dto/sprints.dto";
import { acceptsTasks, canCancel, canComplete, canStart } from "./sprint-policy";
import { Sprint, SprintClosureItem } from "./sprint.entity";

const SPRINT_NOT_FOUND = () => new ApiError(404, "SPRINT_NOT_FOUND", "Sprint no encontrado");
const PROJECT_NOT_AGILE = () =>
  new ApiError(409, "PROJECT_NOT_AGILE", "Los sprints solo existen en proyectos de modalidad agil");
const SPRINT_ALREADY_ACTIVE = () =>
  new ApiError(409, "SPRINT_ALREADY_ACTIVE", "El proyecto ya tiene un sprint activo; cierralo o cancelalo antes");

type Counts = { total: number; done: number; byStatus: Record<TaskStatus, number> };

function emptyCounts(): Counts {
  return { total: 0, done: 0, byStatus: Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number> };
}

function count(statuses: TaskStatus[]) {
  const counts = emptyCounts();

  for (const status of statuses) {
    counts.byStatus[status] += 1;
    counts.total += 1;
  }

  counts.done = counts.byStatus.done;
  return counts;
}

function validateDates(startDate: string, endDate: string) {
  const invalid = [
    ...(!isCalendarDate(startDate) ? [{ field: "startDate", rules: ["isDate"] }] : []),
    ...(!isCalendarDate(endDate) ? [{ field: "endDate", rules: ["isDate"] }] : []),
  ];

  // F2-13: `start_date <= end_date`; la duracion de 1 a 4 semanas es solo una recomendacion.
  if (invalid.length === 0 && endDate < startDate) {
    invalid.push({ field: "endDate", rules: ["afterStartDate"] });
  }

  if (invalid.length > 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Las fechas del sprint no son validas", invalid);
  }
}

function isActiveSprintConflict(error: unknown) {
  return error instanceof QueryFailedError && /UNIQUE constraint failed: sprints\.project_id/i.test(error.message);
}

@Injectable()
export class SprintsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async list(actor: Actor, projectId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    const sprints = await manager.find(Sprint, { where: { projectId }, order: { createdAt: "DESC", id: "ASC" } });
    const progress = await this.progressFor(manager, sprints);

    return {
      items: sprints.map((sprint) => this.sprintView(sprint, project, access, progress.get(sprint.id)!)),
      permissions: { canCreateSprints: this.canManage(project, access) },
    };
  }

  async detail(actor: Actor, projectId: string, sprintId: string) {
    const manager = this.dataSource.manager;
    const { project, access } = await loadProjectWithAccess(manager, actor, projectId);
    return this.detailView(manager, project, access, await this.findSprint(manager, projectId, sprintId));
  }

  async create(actor: Actor, projectId: string, dto: CreateSprintDto) {
    validateDates(dto.startDate, dto.endDate);

    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
      const sprint = await manager.save(
        manager.create(Sprint, {
          projectId,
          name: dto.name,
          goal: dto.goal || null,
          startDate: dto.startDate,
          endDate: dto.endDate,
          status: "planned",
          createdBy: actor.id,
        }),
      );

      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "sprint.created",
        targetType: "sprint",
        targetId: sprint.id,
        details: { projectId, startDate: sprint.startDate, endDate: sprint.endDate },
      });

      return this.detailView(manager, project, access, sprint);
    });
  }

  /** Solo se editan sprints planificados (API minima F2). */
  async update(actor: Actor, projectId: string, sprintId: string, dto: UpdateSprintDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
      const sprint = await this.findSprint(manager, projectId, sprintId);

      if (sprint.status !== "planned") {
        throw new ApiError(409, "SPRINT_NOT_EDITABLE", "Solo se editan los sprints planificados");
      }

      const changes: Partial<Sprint> = {};
      if (dto.name !== undefined) changes.name = dto.name;
      if (dto.goal !== undefined) changes.goal = dto.goal || null;
      if (dto.startDate !== undefined) changes.startDate = dto.startDate;
      if (dto.endDate !== undefined) changes.endDate = dto.endDate;

      validateDates(changes.startDate ?? sprint.startDate, changes.endDate ?? sprint.endDate);

      const fields = Object.keys(changes);

      if (fields.length > 0) {
        await manager.update(Sprint, { id: sprintId }, changes);
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "sprint.updated",
          targetType: "sprint",
          targetId: sprintId,
          details: { projectId, fields },
        });
      }

      return this.detailView(manager, project, access, await this.findSprint(manager, projectId, sprintId));
    });
  }

  /** F2-15: incorpora tareas del backlog del mismo proyecto. */
  async addTasks(actor: Actor, projectId: string, sprintId: string, dto: AddSprintTasksDto) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
      const sprint = await this.findSprint(manager, projectId, sprintId);

      if (!acceptsTasks(sprint.status)) {
        throw new ApiError(409, "SPRINT_CLOSED", "No se agregan tareas a un sprint completado o cancelado");
      }

      const taskIds = [...new Set(dto.taskIds)];
      // Solo tareas de este proyecto: una de otro proyecto se trata como inexistente (prueba F2-5).
      const tasks = await manager.findBy(Task, { id: In(taskIds), projectId });

      if (tasks.length !== taskIds.length) {
        throw new ApiError(404, "TASK_NOT_FOUND", "Alguna tarea no existe en este proyecto");
      }

      const notInBacklog = tasks.filter((task) => task.sprintId !== null);

      if (notInBacklog.length > 0) {
        throw new ApiError(409, "TASK_NOT_IN_BACKLOG", "Solo se agregan tareas que estan en el backlog", {
          taskIds: notInBacklog.map((task) => task.id),
        });
      }

      await manager.update(Task, { id: In(taskIds) }, { sprintId });

      for (const task of tasks) {
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "task.sprint_changed",
          targetType: "task",
          targetId: task.id,
          details: { projectId, from: null, to: sprintId },
        });
      }

      return this.detailView(manager, project, access, sprint);
    });
  }

  /** Devuelve una tarea al backlog mientras el sprint siga planificado o activo. */
  async removeTask(actor: Actor, projectId: string, sprintId: string, taskId: string) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
      const sprint = await this.findSprint(manager, projectId, sprintId);

      if (!acceptsTasks(sprint.status)) {
        throw new ApiError(409, "SPRINT_CLOSED", "Las tareas de un sprint finalizado forman parte de su historial");
      }

      const task = await manager.findOneBy(Task, { id: taskId, projectId, sprintId });

      if (!task) {
        throw new ApiError(404, "TASK_NOT_FOUND", "La tarea no esta en este sprint");
      }

      await manager.update(Task, { id: taskId }, { sprintId: null });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "task.sprint_changed",
        targetType: "task",
        targetId: taskId,
        details: { projectId, from: sprintId, to: null },
      });

      return this.detailView(manager, project, access, sprint);
    });
  }

  /** F2-16 y F2-14: `planned -> active`, con un solo activo por proyecto. */
  async start(actor: Actor, projectId: string, sprintId: string) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
        const sprint = await this.findSprint(manager, projectId, sprintId);

        if (!canStart(sprint.status)) {
          throw new ApiError(409, "INVALID_SPRINT_TRANSITION", "Solo se inicia un sprint planificado");
        }

        if (await manager.existsBy(Sprint, { projectId, status: "active" })) {
          throw SPRINT_ALREADY_ACTIVE();
        }

        // El indice unico parcial respalda la regla si dos inicios llegan a la vez.
        await manager.update(Sprint, { id: sprintId }, { status: "active", startedAt: new Date() });
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "sprint.started",
          targetType: "sprint",
          targetId: sprintId,
          details: { projectId },
        });

        return this.detailView(manager, project, access, await this.findSprint(manager, projectId, sprintId));
      });
    } catch (error) {
      if (isActiveSprintConflict(error)) {
        throw SPRINT_ALREADY_ACTIVE();
      }
      throw error;
    }
  }

  /** F2-17: `active -> completed`; registra el estado final y devuelve lo pendiente al backlog. */
  async complete(actor: Actor, projectId: string, sprintId: string) {
    return this.finish(actor, projectId, sprintId, "completed");
  }

  /** F2-18: `planned/active -> cancelled` con motivo; tambien conserva el historial. */
  async cancel(actor: Actor, projectId: string, sprintId: string, dto: CancelSprintDto) {
    return this.finish(actor, projectId, sprintId, "cancelled", dto.reason);
  }

  private async finish(actor: Actor, projectId: string, sprintId: string, to: "completed" | "cancelled", reason?: string) {
    return this.dataSource.transaction(async (manager) => {
      const { project, access } = await this.loadAgileManageable(manager, actor, projectId);
      const sprint = await this.findSprint(manager, projectId, sprintId);

      if (to === "completed" ? !canComplete(sprint.status) : !canCancel(sprint.status)) {
        throw new ApiError(
          409,
          "INVALID_SPRINT_TRANSITION",
          to === "completed" ? "Solo se cierra un sprint activo" : "Un sprint finalizado no se cancela ni se reactiva",
        );
      }

      const closedAt = new Date();
      const tasks = await manager.findBy(Task, { projectId, sprintId });

      // Registro inmutable (F2-17): una fila por tarea con su estado en este momento.
      if (tasks.length > 0) {
        await manager.insert(
          SprintClosureItem,
          tasks.map((task) => ({ sprintId, taskId: task.id, statusAtClose: task.status, closedAt })),
        );
      }

      // Las terminadas conservan el vinculo historico; las demas vuelven al backlog, sin marcarlas como hechas.
      const unfinished = tasks.filter((task) => task.status !== "done");

      if (unfinished.length > 0) {
        await manager.update(Task, { id: In(unfinished.map((task) => task.id)) }, { sprintId: null });
      }

      await manager.update(
        Sprint,
        { id: sprintId },
        { status: to, finishedAt: closedAt, ...(to === "cancelled" ? { cancelReason: reason ?? null } : {}) },
      );
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: to === "completed" ? "sprint.completed" : "sprint.cancelled",
        targetType: "sprint",
        targetId: sprintId,
        details: {
          projectId,
          from: sprint.status,
          done: tasks.length - unfinished.length,
          returnedToBacklog: unfinished.length,
          ...(reason ? { reason } : {}),
        },
      });

      return this.detailView(manager, project, access, await this.findSprint(manager, projectId, sprintId));
    });
  }

  private canManage(project: Project, access: ProjectAccess) {
    return project.methodology === "agile" && isProjectEditable(project) && canManageProject(access);
  }

  /** Gestion de sprints: lider o autoridad, proyecto agil y no finalizado (F2-16). */
  private async loadAgileManageable(manager: EntityManager, actor: Actor, projectId: string) {
    const loaded = await loadManageableProject(manager, actor, projectId);

    if (loaded.project.methodology !== "agile") {
      throw PROJECT_NOT_AGILE();
    }

    return loaded;
  }

  /** El sprint debe ser del proyecto de la URL (contrato F2). */
  private async findSprint(manager: EntityManager, projectId: string, sprintId: string) {
    const sprint = await manager.findOneBy(Sprint, { id: sprintId, projectId });

    if (!sprint) {
      throw SPRINT_NOT_FOUND();
    }

    return sprint;
  }

  /**
   * Avance de cada sprint: los finalizados se cuentan con su registro de cierre (lo que paso en
   * el sprint); los demas, con las tareas que tienen ahora.
   */
  private async progressFor(manager: EntityManager, sprints: Sprint[]) {
    const ids = sprints.map((sprint) => sprint.id);
    const [tasks, items] = ids.length
      ? await Promise.all([
          manager.find(Task, { select: { sprintId: true, status: true }, where: { sprintId: In(ids) } }),
          manager.find(SprintClosureItem, { where: { sprintId: In(ids) } }),
        ])
      : [[], []];

    return new Map(
      sprints.map((sprint) => [
        sprint.id,
        sprint.status === "completed" || sprint.status === "cancelled"
          ? count(items.filter((item) => item.sprintId === sprint.id).map((item) => item.statusAtClose))
          : count(tasks.filter((task) => task.sprintId === sprint.id).map((task) => task.status)),
      ]),
    );
  }

  private sprintView(sprint: Sprint, project: Project, access: ProjectAccess, progress: Counts) {
    const manageable = this.canManage(project, access);

    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
      startedAt: sprint.startedAt,
      finishedAt: sprint.finishedAt,
      cancelReason: sprint.cancelReason,
      createdAt: sprint.createdAt,
      progress,
      // Ayuda a la interfaz; el backend vuelve a comprobar cada accion.
      permissions: {
        canEdit: manageable && sprint.status === "planned",
        canPlan: manageable && acceptsTasks(sprint.status),
        canStart: manageable && canStart(sprint.status),
        canComplete: manageable && canComplete(sprint.status),
        canCancel: manageable && canCancel(sprint.status),
      },
    };
  }

  private async detailView(manager: EntityManager, project: Project, access: ProjectAccess, sprint: Sprint) {
    const finished = sprint.status === "completed" || sprint.status === "cancelled";
    const progress = await this.progressFor(manager, [sprint]);
    const tasks = await manager.find(Task, {
      where: { projectId: project.id, sprintId: sprint.id },
      relations: { assignee: true },
      order: { createdAt: "ASC", id: "ASC" },
    });
    const closure = finished
      ? await manager
          .getRepository(SprintClosureItem)
          .createQueryBuilder("item")
          .innerJoin(Task, "task", "task.id = item.task_id")
          .select(["item.task_id AS taskId", "item.status_at_close AS statusAtClose", "task.title AS title", "task.status AS currentStatus"])
          .where("item.sprint_id = :sprintId", { sprintId: sprint.id })
          .orderBy("task.created_at", "ASC")
          // Desempate estable por orden de insercion (SQLite).
          .addOrderBy("task.rowid", "ASC")
          .getRawMany<{ taskId: string; statusAtClose: TaskStatus; title: string; currentStatus: TaskStatus }>()
      : [];

    return {
      ...this.sprintView(sprint, project, access, progress.get(sprint.id)!),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee ? { userId: task.assignee.id, fullName: task.assignee.fullName } : null,
      })),
      closure,
    };
  }
}
