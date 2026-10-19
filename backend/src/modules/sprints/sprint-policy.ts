import type { SprintStatus } from "./sprint.entity";

/** Sprints finalizados: no se reactivan ni admiten cambios en el MVP (F2-17, F2-18). */
export const FINAL_SPRINT_STATUSES: SprintStatus[] = ["completed", "cancelled"];

/** F2-15: se agregan o quitan tareas mientras el sprint esta planificado o activo. */
export function acceptsTasks(status: SprintStatus) {
  return status === "planned" || status === "active";
}

/** F2-16: solo `planned -> active`. */
export function canStart(status: SprintStatus) {
  return status === "planned";
}

/** F2-17: solo `active -> completed`. */
export function canComplete(status: SprintStatus) {
  return status === "active";
}

/** F2-18: `planned/active -> cancelled`. */
export function canCancel(status: SprintStatus) {
  return status === "planned" || status === "active";
}
