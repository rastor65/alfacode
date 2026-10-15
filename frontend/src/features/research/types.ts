import type { ProjectStatus, ProjectType } from "@/features/projects/types";

export type ResearchLineStatus = "active" | "inactive";
export type ResearchResultType = "finding" | "prototype" | "methodological" | "other";

export const LINE_STATUS_LABELS: Record<ResearchLineStatus, string> = {
  active: "Activa",
  inactive: "Inactiva",
};

/** Clasificacion del documento de requisitos (seccion 4.6). */
export const RESULT_TYPE_LABELS: Record<ResearchResultType, string> = {
  finding: "Hallazgo",
  prototype: "Prototipo",
  methodological: "Aporte metodológico",
  other: "Otro",
};

export type PersonRef = { userId: string; fullName: string };

export type ResearchLine = {
  id: string;
  name: string;
  description: string | null;
  objectives: string | null;
  status: ResearchLineStatus;
  responsible: PersonRef | null;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
  permissions: { canEdit: boolean; canDelete: boolean };
};

export type ResearchLineDetail = ResearchLine & {
  /** Solo los proyectos que la persona puede ver; `projectCount` incluye los demas. */
  projects: { id: string; name: string; type: ProjectType; status: ProjectStatus }[];
};

export type ResearchLineList = {
  items: ResearchLine[];
  page: number;
  pageSize: number;
  total: number;
  permissions: { canManageLines: boolean };
};

export type ProjectLines = {
  items: { id: string; name: string; status: ResearchLineStatus; linkedAt: string }[];
  permissions: { canManageLines: boolean };
};

export const PROFILE_FIELDS = ["problem", "question", "justification", "methodology", "notes"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export const PROFILE_LABELS: Record<ProfileField, string> = {
  problem: "Problema de investigación",
  question: "Pregunta de investigación",
  justification: "Justificación",
  methodology: "Metodología",
  notes: "Notas",
};

export type ResearchProfile = Record<ProfileField, string | null> & {
  updatedAt: string;
  updatedBy: PersonRef | null;
};

export type ProjectProfile = { profile: ResearchProfile | null; permissions: { canEdit: boolean } };

export type ResearchResult = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  type: ResearchResultType;
  resultDate: string | null;
  references: string | null;
  participants: PersonRef[];
  createdBy: PersonRef | null;
  createdAt: string;
  updatedAt: string;
  permissions: { canEdit: boolean; canDelete: boolean };
};

export type ResultList = { items: ResearchResult[]; permissions: { canManageResults: boolean } };

export function parseLineStatus(value: string | string[] | undefined): ResearchLineStatus | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "active" || candidate === "inactive" ? candidate : undefined;
}

/** Una ficha sin ningun campo con texto se muestra como vacia. */
export function isProfileEmpty(profile: ResearchProfile | null) {
  return !profile || PROFILE_FIELDS.every((field) => !profile[field]);
}

/** Lineas que todavia se pueden asociar: activas y no asociadas ya al proyecto. */
export function linkableLines<T extends { id: string; status: ResearchLineStatus }>(all: readonly T[], linkedIds: readonly string[]) {
  const linked = new Set(linkedIds);
  return all.filter((line) => line.status === "active" && !linked.has(line.id));
}

/**
 * Personas que se pueden elegir como participantes: el equipo actual mas quienes ya figuran en
 * el resultado (aunque hayan salido del equipo), sin repetir y en orden alfabetico.
 */
export function participantOptions(team: readonly PersonRef[], current: readonly PersonRef[] = []) {
  const byId = new Map<string, PersonRef>();

  for (const person of [...team, ...current]) {
    byId.set(person.userId, person);
  }

  return [...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}
