import type { ProjectProgress, TaskItem, TaskPriority, TaskStatus } from "@/features/tasks/types";

export type SprintStatus = "planned" | "active" | "completed" | "cancelled";

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
  planned: "Planificado",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export type SprintPermissions = {
  canEdit: boolean;
  canPlan: boolean;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
};

export type SprintSummary = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  startedAt: string | null;
  finishedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  progress: ProjectProgress;
  permissions: SprintPermissions;
};

export type SprintDetail = SprintSummary & {
  tasks: { id: string; title: string; status: TaskStatus; priority: TaskPriority; assignee: { userId: string; fullName: string } | null }[];
  /** Registro de cierre (solo sprints completados o cancelados). */
  closure: { taskId: string; title: string; statusAtClose: TaskStatus; currentStatus: TaskStatus }[];
};

export type SprintList = { items: SprintSummary[]; permissions: { canCreateSprints: boolean } };

/** Que tareas muestra el tablero de un proyecto agil (F2-10, F2-20). */
export type BoardScope = { kind: "all" } | { kind: "backlog" } | { kind: "sprint"; sprintId: string };

export function activeSprint<T extends Pick<SprintSummary, "status">>(sprints: readonly T[]) {
  return sprints.find((sprint) => sprint.status === "active") ?? null;
}

/** Por defecto se ve el tablero del sprint activo; sin sprint activo, el backlog. */
export function defaultScope(sprints: readonly Pick<SprintSummary, "id" | "status">[]): BoardScope {
  const active = activeSprint(sprints);
  return active ? { kind: "sprint", sprintId: active.id } : { kind: "backlog" };
}

export function tasksInScope<T extends Pick<TaskItem, "sprintId">>(tasks: readonly T[], scope: BoardScope) {
  if (scope.kind === "backlog") {
    return tasks.filter((task) => task.sprintId === null);
  }

  if (scope.kind === "sprint") {
    return tasks.filter((task) => task.sprintId === scope.sprintId);
  }

  return [...tasks];
}

/** Valor serializable para un selector (`all`, `backlog` o el ID del sprint). */
export function scopeValue(scope: BoardScope) {
  return scope.kind === "sprint" ? scope.sprintId : scope.kind;
}

export function parseScope(value: string, sprints: readonly Pick<SprintSummary, "id">[]): BoardScope | null {
  if (value === "all" || value === "backlog") {
    return { kind: value };
  }

  return sprints.some((sprint) => sprint.id === value) ? { kind: "sprint", sprintId: value } : null;
}
