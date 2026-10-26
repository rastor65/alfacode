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

const DAY_MS = 86_400_000;
const dayNumber = (day: string) => Math.round(Date.parse(`${day}T00:00:00Z`) / DAY_MS);

/**
 * Plazo de un sprint respecto de `today` (dia calendario `YYYY-MM-DD`): dias totales y transcurridos
 * (inclusivos) y dias que faltan para el fin; negativo si el plazo ya vencio.
 */
export function sprintTiming(sprint: Pick<SprintSummary, "startDate" | "endDate">, today: string) {
  const total = Math.max(1, dayNumber(sprint.endDate) - dayNumber(sprint.startDate) + 1);
  const elapsed = Math.min(total, Math.max(0, dayNumber(today) - dayNumber(sprint.startDate) + 1));
  return { total, elapsed, remaining: dayNumber(sprint.endDate) - dayNumber(today) };
}

/** Tareas hechas sobre el total de los sprints completados (segun el registro de cierre); `null` si no hay ninguno. */
export function deliveredRate(sprints: readonly Pick<SprintSummary, "status" | "progress">[]) {
  const closed = sprints.filter((sprint) => sprint.status === "completed");
  const total = closed.reduce((sum, sprint) => sum + sprint.progress.total, 0);
  const done = closed.reduce((sum, sprint) => sum + sprint.progress.done, 0);
  return { closed: closed.length, percent: total === 0 ? null : Math.floor((done * 100) / total) };
}
