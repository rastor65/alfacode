import type { EntityManager } from "typeorm";

import { ApiError } from "../../common/api-error";
import type { RoleCode } from "../roles/role.entity";
import type { User } from "../users/user.entity";
import { ProjectMember } from "./project-member.entity";
import { FINAL_PROJECT_STATUSES, type ProjectAccess, canManageProject, projectAccess } from "./project-policy";
import { Project } from "./project.entity";

export type Actor = Pick<User, "id"> & { roles?: { code: RoleCode }[] };

export function actorRoles(actor: Actor): RoleCode[] {
  return (actor.roles ?? []).map((role) => role.code);
}

export const PROJECT_NOT_FOUND = () => new ApiError(404, "PROJECT_NOT_FOUND", "Proyecto no encontrado");
export const PROJECT_FORBIDDEN = () =>
  new ApiError(403, "PROJECT_FORBIDDEN", "No tienes permiso para esta accion en el proyecto");
export const PROJECT_NOT_EDITABLE = () =>
  new ApiError(409, "PROJECT_NOT_EDITABLE", "El proyecto esta finalizado o cancelado y no admite cambios");

export function isProjectEditable(project: Project) {
  return !FINAL_PROJECT_STATUSES.includes(project.status);
}

/** Carga el proyecto y el nivel de acceso; sin acceso responde 404 para no revelar que existe. */
export async function loadProjectWithAccess(
  manager: EntityManager,
  actor: Actor,
  id: string,
): Promise<{ project: Project; access: Exclude<ProjectAccess, "none"> }> {
  const project = await manager.findOneBy(Project, { id });

  if (!project) {
    throw PROJECT_NOT_FOUND();
  }

  const membership = await manager.findOneBy(ProjectMember, { projectId: id, userId: actor.id });
  const access = projectAccess(actorRoles(actor), membership?.role ?? null);

  if (access === "none") {
    throw PROJECT_NOT_FOUND();
  }

  return { project, access };
}

/** Como `loadProjectWithAccess`, pero exige gestionar el proyecto y que no este finalizado. */
export async function loadManageableProject(manager: EntityManager, actor: Actor, id: string) {
  const loaded = await loadProjectWithAccess(manager, actor, id);

  if (!canManageProject(loaded.access)) {
    throw PROJECT_FORBIDDEN();
  }

  if (!isProjectEditable(loaded.project)) {
    throw PROJECT_NOT_EDITABLE();
  }

  return loaded;
}
