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

export interface AuthResource {
  id: string;
  name: string;
  description: string | null;
  urlBackend: string;
  urlFrontend: string | null;
  icon: string | null;
  order: number;
  visibleMenu: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  parentId: string | null;
}

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  accountStatus: "pending" | "active" | "inactive" | "rejected";
  /** Contrasena temporal: debe cambiarla antes de usar el HUB (DEC-016). */
  mustChangePassword: boolean;
  roles: RoleCode[];
  resources?: AuthResource[];
  menu?: AuthResource[];
};

/** Orden en que se ofrecen los roles al asignarlos. */
export const ROLE_CODES: RoleCode[] = ["student", "researcher", "teacher_leader", "coordinator", "admin"];

/** Pueden revisar solicitudes, invitar y administrar integrantes (matriz F1). */
export function isAuthority(roles: readonly RoleCode[]) {
  return roles.includes("admin") || roles.includes("coordinator");
}

/**
 * Roles que la persona puede asignar: un admin cualquiera; un coordinator solo
 * `teacher_leader`, `researcher` y `student`. Solo decide que se muestra; el backend autoriza.
 */
export function assignableRoles(actorRoles: readonly RoleCode[]): RoleCode[] {
  if (actorRoles.includes("admin")) {
    return ROLE_CODES;
  }

  return actorRoles.includes("coordinator") ? ["student", "researcher", "teacher_leader"] : [];
}

/**
 * Si la persona puede administrar a otra: un admin a cualquiera; un coordinator solo a quien
 * no tenga `admin` ni `coordinator`. Nadie a si mismo. Solo presentacion: el backend autoriza.
 */
export function canManageMember(actor: { id: string; roles: readonly RoleCode[] }, target: { id: string; roles: readonly RoleCode[] }) {
  if (actor.id === target.id) {
    return false;
  }

  if (actor.roles.includes("admin")) {
    return true;
  }

  return actor.roles.includes("coordinator") && !target.roles.some((role) => role === "admin" || role === "coordinator");
}
