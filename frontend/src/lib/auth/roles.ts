export type RoleCode = "admin" | "coordinator" | "teacher_leader" | "researcher" | "student";

/** Etiquetas visibles en espanol; los codigos internos se mantienen en ingles (plan, seccion 1.2). */
export const ROLE_LABELS: Record<RoleCode, string> = {
  admin: "Administrador",
  coordinator: "Coordinador",
  teacher_leader: "Docente líder",
  researcher: "Investigador",
  student: "Estudiante",
};

export function roleLabel(code: string) {
  return ROLE_LABELS[code as RoleCode] ?? code;
}

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  accountStatus: "pending" | "active" | "inactive" | "rejected";
  /** Contrasena temporal: debe cambiarla antes de usar el HUB (DEC-016). */
  mustChangePassword: boolean;
  roles: RoleCode[];
};
