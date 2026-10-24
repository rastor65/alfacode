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

/** I-27 (tablero): busqueda, responsable, vencidas y orden combinados; reemplazan al filtro unico anterior. */
export type TaskSort = "priority" | "due" | "recent";
export const TASK_SORT_LABELS: Record<TaskSort, string> = { priority: "Prioridad", due: "Fecha límite", recent: "Más recientes" };
export type TaskQuery = {
  text: string;
  /** `all`, `none` (sin responsable) o el ID de un integrante. */
  assignee: string;
  overdue: boolean;
  sort: TaskSort;
};
export const DEFAULT_TASK_QUERY: TaskQuery = { text: "", assignee: "all", overdue: false, sort: "priority" };

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Aplica la consulta y ordena; con orden por prioridad conserva el orden del backend. */
export function queryTasks(tasks: readonly TaskItem[], query: TaskQuery, today: string) {
  const needle = normalize(query.text.trim());
  const found = tasks.filter(
    (task) =>
      (query.assignee === "all" || (query.assignee === "none" ? task.assignee === null : task.assignee?.userId === query.assignee)) &&
      (!query.overdue || isOverdue(task, today)) &&
      (!needle || normalize(`${task.title} ${task.description ?? ""} ${task.assignee?.fullName ?? ""}`).includes(needle)),
  );

  if (query.sort === "due") {
    return sortTasks(found).sort((a, b) => (a.dueDate === b.dueDate ? 0 : a.dueDate === null ? 1 : b.dueDate === null ? -1 : a.dueDate < b.dueDate ? -1 : 1));
  }

  if (query.sort === "recent") {
    return [...found].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  }

  return sortTasks(found);
}

/** Conteos de las tareas abiertas para los atajos de la barra de filtros. */
export function quickCounts(tasks: readonly TaskItem[], userId: string, today: string) {
  const open = tasks.filter((task) => task.status !== "done");
  return {
    mine: open.filter((task) => task.assignee?.userId === userId).length,
    unassigned: open.filter((task) => task.assignee === null).length,
    overdue: open.filter((task) => isOverdue(task, today)).length,
  };
}

/** Preferencia de vista (tablero o lista), en una cookie para renderizarla sin parpadeo. */
export const TASKS_VIEW_COOKIE = "hub-tasks-view";
export type TasksView = "board" | "list";
export function parseTasksView(value: string | undefined): TasksView {
  return value === "list" ? "list" : "board";
}
export function saveTasksView(view: TasksView) {
  document.cookie = `${TASKS_VIEW_COOKIE}=${view}; path=/; max-age=31536000; samesite=lax`;
}
