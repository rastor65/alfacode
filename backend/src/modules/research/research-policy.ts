import { canManageProject, type ProjectAccess } from "../projects/project-policy";
import { isAuthority } from "../roles/role-policy";
import type { RoleCode } from "../roles/role.entity";

/** F3-01: solo admin y coordinator gestionan las lineas; cualquier integrante activo las consulta. */
export function canManageResearchLines(actorRoles: readonly RoleCode[]) {
  return isAuthority(actorRoles);
}

/**
 * F3-02 a F3-04: lineas asociadas, ficha y resultados de un proyecto los gestiona quien gestiona
 * el proyecto (autoridad o lider); los colaboradores los consultan.
 */
export function canManageProjectResearch(access: ProjectAccess) {
  return canManageProject(access);
}

/** Nombre comparable: sin tildes, en minusculas y con los espacios normalizados. */
export function normalizeLineName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
