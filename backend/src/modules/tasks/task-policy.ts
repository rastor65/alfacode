import { type ProjectAccess, canManageProject } from "../projects/project-policy";

/**
 * Matriz de permisos F2 para tareas:
 * - autoridad o lider del proyecto: crea, edita, asigna y prioriza (F2-09);
 * - colaborador: solo cambia el estado de las tareas que tiene asignadas;
 * - sin acceso al proyecto: la tarea no existe (404).
 */
export function canManageTasks(access: ProjectAccess) {
  return canManageProject(access);
}

export function canChangeTaskStatus(access: ProjectAccess, assigneeId: string | null, actorId: string) {
  return canManageTasks(access) || (access === "collaborator" && assigneeId !== null && assigneeId === actorId);
}
