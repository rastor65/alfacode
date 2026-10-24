import type { ProjectProgress } from "@/features/tasks/types";
import type { ActiveSprint, RiskCode } from "@/features/tracking/types";

export type ProjectType = "research" | "software" | "innovation" | "extension" | "internal" | "other";
export type ProjectMethodology = "traditional" | "agile";
export type ProjectStatus = "proposed" | "planning" | "active" | "paused" | "completed" | "cancelled";
export type ProjectRole = "leader" | "collaborator";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  research: "Investigación",
  software: "Software",
  innovation: "Innovación",
  extension: "Extensión",
  internal: "Interno",
  other: "Otro",
};

export const METHODOLOGY_LABELS: Record<ProjectMethodology, string> = {
  traditional: "Tradicional",
  agile: "Ágil",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  proposed: "Propuesto",
  planning: "En planificación",
  active: "Activo",
  paused: "Pausado",
  completed: "Completado",
  cancelled: "Cancelado",
};

/** Verbo del boton que lleva a cada estado. */
export const STATUS_ACTION_LABELS: Record<ProjectStatus, string> = {
  proposed: "Volver a propuesta",
  planning: "Pasar a planificación",
  active: "Activar",
  paused: "Pausar",
  completed: "Marcar como completado",
  cancelled: "Cancelar proyecto",
};

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  leader: "Líder",
  collaborator: "Colaborador",
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
  myRole: ProjectRole | null;
  memberCount: number;
  leaders: { userId: string; fullName: string }[];
  progress: ProjectProgress;
  // I-27 (catalogo G-01 a G-04): mismas cifras que los paneles de /hub.
  overdue: number;
  unassigned: number;
  myOpen: number;
  sprint: ActiveSprint;
  elapsed: number | null;
  lastActivityAt: string | null;
  risks: RiskCode[];
};

/** Resumen del conjunto visible completo: no cambia con los filtros ni con la pagina. */
export type ProjectListSummary = {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  atRisk: number;
  tasks: { total: number; done: number; progress: number | null };
};

export const PROJECT_SORT_LABELS = {
  activity: "Última actividad",
  name: "Nombre (A-Z)",
  progress: "Mayor avance",
  end_date: "Fecha de fin",
} as const;
export type ProjectSort = keyof typeof PROJECT_SORT_LABELS;

export type ProjectMemberItem = {
  userId: string;
  fullName: string;
  email?: string;
  accountStatus: string;
  role: ProjectRole;
};

/** El detalle no trae los indicadores de la lista (I-27): la pagina los lee de /tracking/projects/:id. */
export type ProjectDetail = Omit<ProjectSummary, "memberCount" | "leaders" | "overdue" | "unassigned" | "myOpen" | "sprint" | "elapsed" | "lastActivityAt" | "risks"> & {
  members: ProjectMemberItem[];
  permissions: {
    canEdit: boolean;
    canManageMembers: boolean;
    canManageTasks: boolean;
    canChangeMethodology: boolean;
    allowedTransitions: ProjectStatus[];
  };
};

export const ALL = "all";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectStatus(value: string | string[] | undefined): ProjectStatus | undefined {
  const candidate = first(value);
  // `hasOwn` y no `in`: `in` acepta claves heredadas como "constructor".
  return candidate && Object.hasOwn(PROJECT_STATUS_LABELS, candidate) ? (candidate as ProjectStatus) : undefined;
}

export function parseMethodology(value: string | string[] | undefined): ProjectMethodology | undefined {
  const candidate = first(value);
  return candidate === "traditional" || candidate === "agile" ? candidate : undefined;
}

/** Fecha de calendario `YYYY-MM-DD` en formato legible, sin conversion de zona horaria. */
export function formatCalendarDate(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function parseSort(value: string | string[] | undefined): ProjectSort {
  const candidate = first(value);
  return candidate && Object.hasOwn(PROJECT_SORT_LABELS, candidate) ? (candidate as ProjectSort) : "activity";
}

/** Interruptor "Solo con alertas": `?alertas=1`. */
export function parseAlerts(value: string | string[] | undefined) {
  return first(value) === "1";
}

export type ListFilters = { q: string; status?: ProjectStatus; methodology?: ProjectMethodology; alerts: boolean; sort: ProjectSort; page: number };

/** Direccion de la lista con los filtros vigentes; cambiar un filtro vuelve a la primera pagina. */
export function projectsHref(current: ListFilters, patch: Partial<ListFilters> = {}) {
  const next: ListFilters = { ...current, page: 1, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("estado", next.status);
  if (next.methodology) params.set("metodologia", next.methodology);
  if (next.alerts) params.set("alertas", "1");
  if (next.sort !== "activity") params.set("orden", next.sort);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString();
  return query ? `/hub/proyectos?${query}` : "/hub/proyectos";
}

/** Preferencia de vista de la lista (tarjetas o tabla), guardada en una cookie para renderizarla sin parpadeo. */
export const VIEW_COOKIE_NAME = "hub-projects-view";
export type ProjectsView = "cards" | "table";
export function parseView(value: string | undefined): ProjectsView {
  return value === "table" ? "table" : "cards";
}

/** Guarda la preferencia de vista; solo se llama desde un evento del navegador. */
export function saveView(view: ProjectsView) {
  document.cookie = `${VIEW_COOKIE_NAME}=${view}; path=/; max-age=31536000; samesite=lax`;
}

/** Dias transcurridos y totales del periodo planificado (fechas `YYYY-MM-DD`); sin fechas validas, null. */
export function daysSpan(start: string | null, end: string | null, today: string) {
  if (!start || !end) return null;
  const at = (day: string) => Date.parse(`${day}T00:00:00Z`), DAY = 86_400_000;
  const total = Math.round((at(end) - at(start)) / DAY);
  if (total <= 0) return null;
  return { elapsed: Math.min(total, Math.max(0, Math.round((at(today) - at(start)) / DAY))), total };
}
