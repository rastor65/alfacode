import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { eyebrow, panelCard } from "./dashboard-ui";

type KpiCardProps = {
  label: string;
  icon: LucideIcon;
  value?: number | string;
  hint?: string;
  /** Marca las cifras calculadas solo con los elementos de la pagina visible. */
  scoped?: boolean;
  tone?: "danger";
  children?: ReactNode;
};

/** Indicador del panel: etiqueta, cifra, nota y, si hace falta, contenido propio (barras, chips). Va dentro de un `<dl>`. */
export function KpiCard({ label, icon: Icon, value, hint, scoped, tone, children }: KpiCardProps) {
  const danger = tone === "danger";

  return (
    <div className={cn(panelCard, "flex min-w-0 items-start justify-between gap-3 p-4 transition-shadow hover:shadow-md")}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <dt className={eyebrow}>
          {label}
          {scoped && <span className="ml-1.5 font-medium normal-case tracking-normal text-hub-accent">en esta página</span>}
        </dt>
        <dd className="flex min-w-0 flex-col gap-1.5">
          {value !== undefined && <span className={cn("truncate text-3xl font-semibold tabular-nums", danger ? "text-hub-field-error" : "text-hub-text")}>{value}</span>}
          {hint && (
            <span className="line-clamp-2 text-xs text-hub-muted" title={hint}>
              {hint}
            </span>
          )}
          {children}
        </dd>
      </div>
      <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", danger ? "bg-hub-danger-bg text-hub-field-error" : "bg-hub-accent-soft text-hub-accent")}>
        <Icon className="size-6" />
      </span>
    </div>
  );
}

/** Barra segmentada; cada tramo es una proporcion (las cifras tambien van en texto). */
export function SegmentBar({ segments }: { segments: { className: string; share: number }[] }) {
  return (
    <span aria-hidden="true" className="mt-1 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border">
      {segments
        .filter((segment) => segment.share > 0)
        .map((segment) => (
          <span key={segment.className} className={segment.className} style={{ width: `${segment.share * 100}%` }} />
        ))}
    </span>
  );
}
