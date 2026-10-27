import { CircleCheck, CircleX, Search } from "lucide-react";
import type { ReactNode } from "react";

import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { cn } from "@/lib/utils";

/** Estilos y piezas compartidas por las cuatro pestañas de Roles y Recursos. */

export const tableHeadClass = cn(eyebrow, "bg-hub-subtle");
export const rowClass = "transition-colors hover:bg-hub-hover/60";

/** Contenedor de tabla: tarjeta del panel con desplazamiento horizontal interno. */
export function TableCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className={cn(panelCard, "overflow-hidden")}>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

/** Fila de una tabla con un mensaje centrado (vacio, carga o error). */
export function MessageRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-hub-muted">
        {children}
      </td>
    </tr>
  );
}

/** Estado activo/inactivo con icono y texto. */
export function ActiveChip({ active }: { active: boolean }) {
  return active ? (
    <span className={`${chip} gap-1 rounded-full bg-hub-success-bg px-2.5 py-1 text-hub-success-text`}>
      <CircleCheck aria-hidden="true" className="size-3" />
      Activo
    </span>
  ) : (
    <span className={`${neutralChip} gap-1 rounded-full px-2.5 py-1`}>
      <CircleX aria-hidden="true" className="size-3" />
      Inactivo
    </span>
  );
}

/** Barra de herramientas: busqueda a la izquierda y acciones a la derecha. */
export function Toolbar({
  label,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div role="search" className={cn(panelCard, "flex flex-col items-stretch justify-between gap-2 p-2 sm:flex-row sm:items-center")}>
      <label className="relative min-w-60 flex-1 sm:max-w-md">
        <span className="sr-only">{label}</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-hub-muted" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-h-10 w-full rounded-lg bg-hub-subtle py-2 pl-10 pr-4 text-sm text-hub-text placeholder:text-hub-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        />
      </label>
      {children}
    </div>
  );
}

/** Casilla con su etiqueta, para los formularios de los modales. */
export function CheckField({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-9 cursor-pointer select-none items-center gap-2 text-sm text-hub-text">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 cursor-pointer accent-(--hub-accent)" />
      {label}
    </label>
  );
}

/** Etiqueta de un campo que no es un `FormField` (selectores). */
export const fieldLabelClass = "mb-1.5 block text-xs font-semibold text-hub-text";
