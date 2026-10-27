import Link from "next/link";

import { formatDateTime } from "@/lib/format";

import { plural, progressLabel, type TaskSummary } from "../types";

/** Indicador numerico con etiqueta; las cifras vienen del backend ya filtradas por permisos. */
export function Stat({ label, value, hint, href }: { label: string; value: number | string; hint?: string; href?: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-hub-border bg-hub-subtle p-4">
      <dt className="text-sm text-hub-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-hub-text">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-hub-muted">{hint}</dd>}
      {href && (
        <dd className="mt-auto pt-2 text-sm">
          <Link href={href} className="text-hub-accent underline-offset-4 hover:underline">
            Ver detalle<span className="sr-only">: {label}</span>
          </Link>
        </dd>
      )}
    </div>
  );
}

export function StatGrid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <dl aria-label={label} className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {children}
    </dl>
  );
}

/**
 * F6-08: barras horizontales de una sola serie (conteo por categoria). Etiqueta y valor son texto
 * (la lista es tambien su tabla); la barra es decorativa. Se listan las categorias en cero para no
 * ocultar la ausencia de datos; sin ningun registro se indica "Sin datos".
 */
export function Breakdown<K extends string>({ title, labels, counts }: { title: string; labels: Record<K, string>; counts: Record<K, number> }) {
  const keys = Object.keys(labels) as K[];
  const max = Math.max(0, ...keys.map((key) => counts[key] ?? 0));
  return (
    <section className="rounded-2xl border border-hub-border p-4" aria-label={title}>
      <h3 className="text-sm font-semibold text-hub-text">{title}</h3>
      {max === 0 ? (
        <p className="mt-3 text-sm text-hub-muted">Sin datos registrados.</p>
      ) : (
        <dl className="mt-3 space-y-2.5 text-sm">
          {keys.map((key) => {
            const value = counts[key] ?? 0;
            return (
              <div key={key} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,11rem)_1fr]">
                <dt className={value ? "truncate text-hub-text" : "truncate text-hub-muted"} title={labels[key]}>{labels[key]}</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  {value > 0 && <span aria-hidden="true" className="h-2 rounded-r bg-hub-chart" style={{ width: `${Math.max(2, (value / max) * 85)}%` }} />}
                  <span className="tabular-nums font-medium text-hub-text">{value}</span>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

/** Avance operativo de tareas: referencia de actividad, no medida de calidad. */
export function TaskProgress({ title, summary }: { title: string; summary: TaskSummary }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-hub-text">{title}</h3>
        <p className="text-sm tabular-nums">
          <span className="font-semibold">{progressLabel(summary)}</span>
          {summary.total > 0 && <span className="text-hub-muted"> · {summary.done} de {plural(summary.total, "tarea terminada", "tareas terminadas")}</span>}
        </p>
      </div>
      {summary.progress !== null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hub-border" aria-hidden="true">
          <div className="h-full rounded-r-full bg-hub-chart" style={{ width: `${summary.progress}%` }} />
        </div>
      )}
    </div>
  );
}

export function Cutoff({ value }: { value: string }) {
  return (
    <p className="text-xs text-hub-muted">
      Datos al <time dateTime={value}>{formatDateTime(value)}</time> · Se calculan con la información que puedes consultar.
    </p>
  );
}
