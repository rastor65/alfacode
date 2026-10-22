import type { PRODUCT_STATUSES, PRODUCT_TYPES } from "@/features/academic/types";
import type { EVENT_STATUSES, EVENT_TYPES } from "@/features/events/types";
import type { ProjectMethodology, ProjectRole, ProjectStatus, ProjectType } from "@/features/projects/types";
import type { TaskStatus } from "@/features/tasks/types";

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
};

export type PersonalPanel = {
  cutoff: string;
  today: string;
  projects: { total: number; byStatus: Record<ProjectStatus, number>; leading: number; items: { id: string; name: string; status: ProjectStatus; role: ProjectRole }[] };
  tasks: { open: number; overdue: number; done: number; items: { id: string; title: string; status: TaskStatus; dueDate: string | null; projectId: string; projectName: string }[] };
  events: { attended: number; upcoming: { id: string; title: string; startsAt: string; mode: string; projectId: string | null }[] };
  products: { total: number; byStatus: Record<ProductStatus, number> };
};

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
