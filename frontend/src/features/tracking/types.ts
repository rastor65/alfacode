import type { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/features/academic/types";
import type { EVENT_STATUSES, EVENT_TYPES } from "@/features/events/types";
import type { ProjectMethodology, ProjectRole, ProjectStatus, ProjectType } from "@/features/projects/types";
import type { TaskPriority, TaskStatus } from "@/features/tasks/types";

// Contrato de /tracking/*; definiciones en docs/catalogo-indicadores.md (F6-01).
export type EventStatus = keyof typeof EVENT_STATUSES;
export type ProductStatus = keyof typeof PRODUCT_STATUSES;
export type TaskSummary = { byStatus: Record<TaskStatus, number>; total: number; done: number; pending: number; progress: number | null };

export type InstitutionalPanel = {
  cutoff: string;
  members: { active: number };
  projects: { total: number; byStatus: Record<ProjectStatus, number>; byType: Record<ProjectType, number> };
  events: { total: number; byStatus: Record<EventStatus, number>; completed: number; attendances: number };
  products: { total: number; byStatus: Record<ProductStatus, number>; published: number };
  tasks: TaskSummary;
};

type SprintSummary = { id: string; name: string; startDate: string; endDate: string; tasks: TaskSummary };
export type ProjectPanel = {
  cutoff: string;
  today: string;
  project: { id: string; name: string; status: ProjectStatus; type: ProjectType; methodology: ProjectMethodology; startDate: string | null; endDate: string | null };
  tasks: TaskSummary & { overdue: number; dueSoon: number; unassigned: number };
  sprints: { active: SprintSummary | null; lastCompleted: (SprintSummary & { finishedAt: string | null }) | null } | null;
  deliverables: { researchResults: number; products: { total: number; byStatus: Record<ProductStatus, number> } };
  events: { total: number; byStatus: Record<EventStatus, number> };
  team: { members: number; leaders: number };
  /** G-02 a G-04 del proyecto (solo los activos tienen alertas). */
  signals: { elapsed: number | null; lastActivityAt: string | null; risks: RiskCode[] };
  /** M-09: mis tareas abiertas en este proyecto, por fecha limite. */
  myTasks: { open: number; items: { id: string; title: string; status: TaskStatus; priority: TaskPriority; dueDate: string | null }[] };
};

type Progress = { total: number; done: number; progress: number | null };
export type ActiveSprint = { id: string; name: string; endDate: string; tasks: Progress } | null;
export type ProjectCard = {
  id: string; name: string; status: ProjectStatus; role: ProjectRole; tasks: Progress; overdue: number; unassigned: number; myOpen: number; sprint: ActiveSprint;
  leaders: { id: string; fullName: string }[];
};
export type RecentObservation = { id: string; kind: keyof typeof OBSERVATION_KINDS; excerpt: string; createdAt: string; project: { id: string; name: string }; author: string | null };

export type PersonalPanel = {
  cutoff: string;
  today: string;
  projects: { total: number; byStatus: Record<ProjectStatus, number>; leading: number; items: ProjectCard[] };
  tasks: { open: number; overdue: number; dueSoon: number; done: number; byStatus: Record<TaskStatus, number>; items: { id: string; title: string; status: TaskStatus; dueDate: string | null; projectId: string; projectName: string }[] };
  events: { attended: number; upcoming: { id: string; title: string; startsAt: string; mode: string; projectId: string | null; projectName: string | null }[] };
  products: { total: number; byStatus: Record<ProductStatus, number> };
  observations: RecentObservation[];
};

/** G-04; textos de cada alerta en RISK_LABELS. */
export type RiskCode = "overdue_tasks" | "past_end_date" | "inactive" | "behind_schedule";
export const RISK_LABELS: Record<RiskCode, string> = {
  overdue_tasks: "Tareas vencidas",
  past_end_date: "Fecha de fin superada",
  inactive: "Sin actividad en 14 días",
  behind_schedule: "Avance por debajo del tiempo",
};
type Place = { id: string; name: string } | null;
export type OverviewPanel = {
  cutoff: string;
  today: string;
  projects: {
    total: number;
    items: {
      id: string; name: string; type: ProjectType; methodology: ProjectMethodology; status: ProjectStatus; startDate: string | null; endDate: string | null;
      leaders: { id: string; fullName: string }[]; tasks: Progress; overdue: number; sprint: ActiveSprint; elapsed: number | null; lastActivityAt: string | null; risks: RiskCode[];
    }[];
  };
  pending: { membershipRequests: number; administrativeRequests: { pending: number; inReview: number } };
  agenda: { id: string; title: string; startsAt: string; mode: string; project: Place }[];
  recent: { observations: RecentObservation[]; products: { id: string; title: string; status: ProductStatus; createdAt: string; project: Place }[] };
};

/** Tareas por vencer (hoy a hoy + 7) a partir de la lista ya ordenada por el backend. */
export function splitDeadlines<T extends { dueDate: string | null }>(items: T[], today: string, soon: string) {
  return {
    overdue: items.filter((task) => task.dueDate !== null && task.dueDate < today),
    dueSoon: items.filter((task) => task.dueDate !== null && task.dueDate >= today && task.dueDate <= soon),
  };
}

/**
 * Tiempo transcurrido respecto al corte del panel (no al reloj del navegador, para que servidor y
 * cliente rendericen igual). Mas de 30 dias: null, y se muestra la fecha completa.
 */
export function relativeTime(iso: string, cutoff: string) {
  const minutes = Math.floor((Date.parse(cutoff) - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days <= 30 ? `Hace ${plural(days, "día", "días")}` : null;
}

/** Atraso de una fecha limite ya vencida respecto a hoy (ambas YYYY-MM-DD). */
export function overdueLabel(dueDate: string, today: string) {
  const days = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86_400_000);
  return days <= 1 ? "Ayer" : `Hace ${days} días`;
}

/** Dia calendario mas `days` sobre una fecha YYYY-MM-DD (sin zona horaria). */
export function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Porcentaje solo con tareas; nunca 0 % ni 100 % sin datos. */
export function progressLabel(summary: Pick<TaskSummary, "progress">) {
  return summary.progress === null ? "Sin tareas" : `${summary.progress} %`;
}

export function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export const OBSERVATION_KINDS = { progress: "Avance", difficulty: "Dificultad", result: "Resultado", general: "Observación general" } as const;
export type Observation = {
  id: string; kind: keyof typeof OBSERVATION_KINDS; body: string; createdAt: string;
  author: { id: string; fullName: string | null }; permissions: { canDelete: boolean };
};
export type ObservationList = { items: Observation[]; total: number; page: number; pageSize: number; permissions: { canCreate: boolean } };

type ReportPage<Row, Summary> = { summary: Summary; items: Row[]; total: number; page: number; pageSize: number };
export type ProjectReport = ReportPage<{
  id: string; name: string; type: ProjectType; status: ProjectStatus; methodology: ProjectMethodology; startDate: string | null; endDate: string | null;
  lines: string[]; tasks: { total: number; done: number; progress: number | null }; products: number; researchResults: number; events: number;
}, { total: number; byStatus: Record<ProjectStatus, number>; tasks: { total: number; done: number; progress: number | null } }>;
export type ProductReport = ReportPage<{
  id: string; title: string; type: keyof typeof PRODUCT_TYPES; status: ProductStatus; productDate: string | null; project: { id: string; name: string } | null; authors: number;
}, { total: number; byStatus: Record<ProductStatus, number>; byType: Record<keyof typeof PRODUCT_TYPES, number> }>;
export type EventReport = ReportPage<{
  id: string; title: string; type: keyof typeof EVENT_TYPES; status: EventStatus; startsAt: string; project: { id: string; name: string } | null; participants: number; attended: number;
}, { total: number; byStatus: Record<EventStatus, number>; attended: number }>;
