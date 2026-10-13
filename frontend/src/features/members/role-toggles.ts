import { ROLE_CODES, type RoleCode, assignableRoles } from "@/lib/auth/roles";

import type { AccountStatus } from "./types";

export type RoleToggle = {
  role: RoleCode;
  checked: boolean;
  disabled: boolean;
  /** Por que no se puede cambiar (se muestra junto al interruptor). */
  reason: string | null;
};

/** Orden de presentacion: de mayor a menor alcance institucional. */
const DISPLAY_ORDER: RoleCode[] = [...ROLE_CODES].reverse();

/**
 * Estado de cada interruptor de rol en el detalle de un integrante. Refleja las reglas del
 * backend (que es quien autoriza) para no ofrecer cambios que serian rechazados.
 */
export function roleToggles(
  member: { roles: readonly RoleCode[]; accountStatus: AccountStatus },
  actorRoles: readonly RoleCode[],
  /** Bloquea todos los interruptores con este motivo (p. ej. la propia cuenta). */
  lockedReason: string | null = null,
): RoleToggle[] {
  const assignable = assignableRoles(actorRoles);
  const editableStatus = member.accountStatus === "active" || member.accountStatus === "inactive";
  const isLastRoleOfActive = member.accountStatus === "active" && member.roles.length === 1;

  return DISPLAY_ORDER.map((role) => {
    const checked = member.roles.includes(role);
    let reason: string | null = null;

    if (lockedReason) {
      reason = lockedReason;
    } else if (!editableStatus) {
      reason = "Se asigna al aprobar la solicitud o al activar la cuenta.";
    } else if (!assignable.includes(role)) {
      reason = "Solo un administrador puede asignar o quitar este rol.";
    } else if (checked && isLastRoleOfActive) {
      reason = "Una cuenta activa debe conservar al menos un rol.";
    }

    return { role, checked, disabled: reason !== null, reason };
  });
}
