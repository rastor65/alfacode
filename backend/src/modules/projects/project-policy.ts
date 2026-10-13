import { isAuthority } from "../roles/role-policy";
import type { RoleCode } from "../roles/role.entity";
import type { ProjectRole } from "./project-member.entity";
import type { ProjectStatus } from "./project.entity";

/**
 * Nivel de acceso a un proyecto (matriz de permisos F2):
 * - `authority`: admin o coordinator, administran cualquier proyecto;
 * - `leader`: lider del proyecto, gestiona proyecto y equipo;
 * - `collaborator`: consulta el proyecto;
 * - `none`: sin acceso (el proyecto se trata como inexistente, 404).
 * Un `teacher_leader` institucional que no pertenece al proyecto no recibe acceso.
 */
export type ProjectAccess = "authority" | "leader" | "collaborator" | "none";

export function projectAccess(actorRoles: readonly RoleCode[], membershipRole: ProjectRole | null): ProjectAccess {
  if (isAuthority(actorRoles)) {
    return "authority";
  }

  return membershipRole ?? "none";
}

/** F2-03: por defecto solo admin y coordinator crean proyectos (DEC-018). */
export function canCreateProject(actorRoles: readonly RoleCode[]) {
  return isAuthority(actorRoles);
}

export function canManageProject(access: ProjectAccess) {
  return access === "authority" || access === "leader";
}

/** Proyectos finalizados: no se editan ni cambian de equipo en el MVP (F2-02). */
export const FINAL_PROJECT_STATUSES: ProjectStatus[] = ["completed", "cancelled"];

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  proposed: ["planning", "active", "cancelled"],
  planning: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function allowedProjectTransitions(status: ProjectStatus) {
  return TRANSITIONS[status];
}

export function canTransitionProject(from: ProjectStatus, to: ProjectStatus) {
  return TRANSITIONS[from].includes(to);
}
