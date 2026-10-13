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
};

export type ProjectMemberItem = {
  userId: string;
  fullName: string;
  email?: string;
  accountStatus: string;
  role: ProjectRole;
};

export type ProjectDetail = Omit<ProjectSummary, "memberCount" | "leaders"> & {
  members: ProjectMemberItem[];
  permissions: { canEdit: boolean; canManageMembers: boolean; allowedTransitions: ProjectStatus[] };
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
