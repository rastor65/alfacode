export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high";

/** Orden fijo de las columnas del tablero (F2-11). */
export const TASK_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecha",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export type TaskItem = {
  id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: { userId: string; fullName: string } | null;
  createdBy: { userId: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  permissions: { canEdit: boolean; canChangeStatus: boolean };
};

export type ProjectProgress = { total: number; done: number; byStatus: Record<TaskStatus, number> };

export type TaskList = {
  items: TaskItem[];
  page: number;
  pageSize: number;
  total: number;
  progress: ProjectProgress;
  permissions: { canManageTasks: boolean };
};

/**
 * F2-12: sin tareas no hay porcentaje (nunca "100 %"). El porcentaje es de tareas hechas,
 * no de cumplimiento del proyecto.
 */
export function describeProgress(progress: ProjectProgress) {
  if (progress.total === 0) {
    return { label: "Sin tareas", percent: null };
  }

  return {
    label: `${progress.done} de ${progress.total} ${progress.total === 1 ? "tarea hecha" : "tareas hechas"}`,
    percent: Math.floor((progress.done / progress.total) * 100),
  };
}

/** Progreso a partir de las tareas cargadas (el tablero las tiene todas). */
export function computeProgress(tasks: readonly Pick<TaskItem, "status">[]): ProjectProgress {
  const byStatus = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;

  for (const task of tasks) {
    byStatus[task.status] += 1;
  }

  return { total: tasks.length, done: byStatus.done, byStatus };
}

export type TaskFilter = "all" | "mine" | "unassigned";

export const TASK_FILTER_LABELS: Record<TaskFilter, string> = {
  all: "Todas",
  mine: "Mis tareas",
  unassigned: "Sin responsable",
};

export function filterTasks(tasks: readonly TaskItem[], filter: TaskFilter, userId: string) {
  if (filter === "mine") {
    return tasks.filter((task) => task.assignee?.userId === userId);
  }

  if (filter === "unassigned") {
    return tasks.filter((task) => task.assignee === null);
  }

  return [...tasks];
}

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Mismo orden que el backend: prioridad y, a igual prioridad, la mas antigua primero. */
export function sortTasks(tasks: readonly TaskItem[]) {
  return [...tasks].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
}

/** Agrupa por columna conservando el orden del backend (prioridad y antiguedad). */
export function groupByStatus(tasks: readonly TaskItem[]) {
  const columns = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as TaskItem[]])) as Record<
    TaskStatus,
    TaskItem[]
  >;

  for (const task of tasks) {
    columns[task.status].push(task);
  }

  return columns;
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (TASK_STATUSES as readonly string[]).includes(value);
}

/** Fecha limite vencida: anterior a hoy en Bogota y la tarea no esta hecha. */
export function isOverdue(task: Pick<TaskItem, "dueDate" | "status">, today: string) {
  return task.dueDate !== null && task.status !== "done" && task.dueDate < today;
}

/** Fecha de calendario de hoy (`YYYY-MM-DD`) en la zona horaria de la universidad. */
export function todayInBogota(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(now);
}
