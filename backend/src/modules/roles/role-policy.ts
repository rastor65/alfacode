import { INSTITUTIONAL_ROLES, type RoleCode } from "./role.entity";

/** Roles que pueden administrar vinculaciones e integrantes (ver matriz de permisos F1). */
export const MEMBERSHIP_AUTHORITIES: RoleCode[] = ["admin", "coordinator"];

const COORDINATOR_ASSIGNABLE: RoleCode[] = ["teacher_leader", "researcher", "student"];

/** Roles que un coordinator no puede asignar, retirar ni administrar en otras personas. */
const PROTECTED_ROLES: RoleCode[] = ["admin", "coordinator"];

export function isRoleCode(value: unknown): value is RoleCode {
  return INSTITUTIONAL_ROLES.some((role) => role.code === value);
}

export function isAuthority(roles: readonly RoleCode[]) {
  return roles.some((role) => MEMBERSHIP_AUTHORITIES.includes(role));
}

/**
 * Un admin puede asignar cualquier rol. Un coordinator solo `teacher_leader`, `researcher`
 * y `student`: nunca `admin` ni `coordinator`. Con varios roles se evalua la union.
 */
export function canAssignRole(actorRoles: readonly RoleCode[], target: RoleCode) {
  if (actorRoles.includes("admin")) {
    return true;
  }

  return actorRoles.includes("coordinator") && COORDINATOR_ASSIGNABLE.includes(target);
}

/**
 * Un admin puede administrar a cualquier persona. Un coordinator solo a quien no tenga
 * `admin` ni `coordinator`, para no poder desactivar ni alterar a sus pares o superiores.
 */
export function canManageUser(actorRoles: readonly RoleCode[], targetRoles: readonly RoleCode[]) {
  if (actorRoles.includes("admin")) {
    return true;
  }

  return actorRoles.includes("coordinator") && !targetRoles.some((role) => PROTECTED_ROLES.includes(role));
}
