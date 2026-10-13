"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RoleCode, roleLabel } from "@/lib/auth/roles";

/** Valor del filtro sin rol; Radix no admite valores vacios en sus opciones. */
export const ALL_ROLES = "all";

type RoleSelectProps = {
  id: string;
  name: string;
  roles: readonly RoleCode[];
  defaultValue?: string;
  /** Agrega la opcion "Todos" (filtros). */
  includeAll?: boolean;
  className?: string;
};

/** Selector de rol institucional (shadcn `Select`). Con `name` funciona en formularios. */
export function RoleSelect({ id, name, roles, defaultValue, includeAll = false, className }: RoleSelectProps) {
  // Envoltura: Radix agrega junto al trigger un <select> oculto para formularios; sin ella,
  // los `space-y-*` del contenedor le darian margen y desalinearian el campo.
  return (
    <div className="relative">
      <Select name={name} defaultValue={defaultValue ?? (includeAll ? ALL_ROLES : roles[0])}>
        <SelectTrigger id={id} className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value={ALL_ROLES}>Todos</SelectItem>}
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {roleLabel(role)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
