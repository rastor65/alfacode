import { Award, BookOpen, Filter, Search, Square, SquareCheck, X } from "lucide-react";
import Link from "next/link";

import { chip, eyebrow, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural } from "@/features/tracking/types";
import { formatShortDay } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_KEYS,
  PRODUCT_TYPES,
  PRODUCT_TYPE_KEYS,
  type AcademicKind,
  type ProductStatus,
  productStats,
} from "./types";

/** Color de cada estado en la barra; las cifras siempre se repiten en texto. */
export const STATUS_BAR: Record<ProductStatus, string> = {
  in_progress: "bg-hub-series-1",
  submitted: "bg-hub-series-2",
  accepted: "bg-hub-series-3",
  published: "bg-hub-series-4",
  rejected: "bg-hub-field-error",
};

type KpisProps = {
  productsTotal: number;
  recognitionsTotal: number;
  stats: ReturnType<typeof productStats>;
};

function Kpi({ label, value, hint, children }: { label: string; value: string | number; hint: string; children?: React.ReactNode }) {
  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-4`}>
      <dt className={eyebrow}>{label}</dt>
      <dd className="flex min-w-0 flex-col gap-1.5">
        <span className="truncate text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
        <span className="line-clamp-2 text-xs text-hub-muted">{hint}</span>
        {children}
      </dd>
    </div>
  );
}

/** Indicadores de produccion: totales, estados, tipos y ultima publicacion. */
export function AcademicKpis({ productsTotal, recognitionsTotal, stats }: KpisProps) {
  const sampled = PRODUCT_STATUS_KEYS.reduce((sum, key) => sum + stats.byStatus[key], 0);
  const usedTypes = PRODUCT_TYPE_KEYS.filter((key) => stats.byType[key] > 0);
  const usedStatuses = PRODUCT_STATUS_KEYS.filter((key) => stats.byStatus[key] > 0);
  const latest = stats.latestPublished;

  return (
    <dl aria-label="Indicadores de producción" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi label="Productos" value={productsTotal} hint={plural(recognitionsTotal, "reconocimiento", "reconocimientos")} />
      <Kpi
        label="Estado"
        value={`${stats.byStatus.published} ${stats.byStatus.published === 1 ? "publicado" : "publicados"}`}
        hint={usedStatuses.length > 0 ? usedStatuses.map((key) => `${PRODUCT_STATUSES[key]} ${stats.byStatus[key]}`).join(" · ") : "Sin productos"}
      >
        {sampled > 0 && (
          <span aria-hidden="true" className="mt-1 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-hub-border">
            {usedStatuses.map((key) => (
              <span key={key} className={STATUS_BAR[key]} style={{ width: `${(stats.byStatus[key] * 100) / sampled}%` }} />
            ))}
          </span>
        )}
      </Kpi>
      <Kpi
        label="Tipos"
        value={usedTypes.length}
        hint={usedTypes.length > 0 ? usedTypes.map((key) => `${PRODUCT_TYPES[key]} ${stats.byType[key]}`).join(" · ") : "Sin productos"}
      />
      <Kpi
        label="Última publicación"
        value={latest?.productDate ? `${formatShortDay(latest.productDate)} ${latest.productDate.slice(0, 4)}` : "—"}
        hint={latest ? `${latest.title}${latest.source ? ` · ${latest.source}` : ""}` : "Aún sin publicados con fecha"}
      />
    </dl>
  );
}

const controlClass =
  "min-h-9 max-w-56 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

type ToolbarProps = {
  path: string;
  kind: AcademicKind;
  productsTotal: number;
  recognitionsTotal: number;
  q: string;
  type?: string;
  status?: string;
  /** El filtro "Mi participacion" esta activo. */
  mine: boolean;
  authorId?: string;
  /** Construye el enlace con los filtros actuales y los cambios indicados. */
  link: (changes: Record<string, string>) => string;
  userId: string;
};

/** Cambio de vista, "Mi participacion" y filtros. Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */
export function AcademicToolbar({ path, kind, productsTotal, recognitionsTotal, q, type, status, mine, authorId, link, userId }: ToolbarProps) {
  const products = kind === "academic-products";
  const filtering = Boolean(q || type || status);
  const segment = (active: boolean) =>
    cn(
      "inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
      active ? "bg-hub-panel text-hub-accent shadow-sm ring-1 ring-hub-border" : "text-hub-soft hover:text-hub-text",
    );
  const count = "rounded-full bg-hub-border px-1.5 font-mono text-[11px] text-hub-text";

  return (
    <div className={`${panelCard} flex min-w-0 flex-col gap-3 p-3`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label="Tipo de registro académico" className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-lg bg-hub-subtle p-1">
          <Link href={link({ vista: "academic-products", pagina: "" })} aria-current={products ? "page" : undefined} className={segment(products)}>
            <BookOpen aria-hidden="true" className="size-4" />
            Productos académicos
            <span className={count}>{productsTotal}</span>
          </Link>
          <Link href={link({ vista: "recognitions", pagina: "" })} aria-current={!products ? "page" : undefined} className={segment(!products)}>
            <Award aria-hidden="true" className="size-4" />
            Reconocimientos
            <span className={count}>{recognitionsTotal}</span>
          </Link>
        </nav>
        <Link
          href={link({ integrante: authorId ? "" : userId, pagina: "" })}
          aria-current={mine ? "true" : undefined}
          className={cn(
            "inline-flex min-h-9 items-center gap-2 self-start rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
            mine ? "bg-hub-accent-soft text-hub-accent ring-1 ring-hub-accent" : "bg-hub-subtle text-hub-soft hover:bg-hub-hover",
          )}
        >
          {mine ? <SquareCheck aria-hidden="true" className="size-4" /> : <Square aria-hidden="true" className="size-4" />}
          {authorId && !mine ? "Quitar filtro de integrante" : "Mi participación"}
        </Link>
      </div>

      {/* La clave reinicia los campos (no controlados) cuando cambian los filtros por un enlace, como "Limpiar". */}
      <form key={`${kind}|${q}|${type ?? ""}|${status ?? ""}`} action={path} method="get" role="search" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="vista" value={kind} />
        {authorId && <input type="hidden" name="integrante" value={authorId} />}
        <label className="relative block min-w-56 flex-1 lg:max-w-md">
          <span className="sr-only">Buscar por título</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
          <input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Buscar por título" className={`${controlClass} w-full max-w-none pl-9`} />
        </label>
        {products && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-hub-muted">
              Tipo
              <select name="tipo" defaultValue={type ?? ""} className={controlClass}>
                <option value="">Todos</option>
                {PRODUCT_TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PRODUCT_TYPES[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-hub-muted">
              Estado
              <select name="estado" defaultValue={status ?? ""} className={controlClass}>
                <option value="">Todos</option>
                {PRODUCT_STATUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {PRODUCT_STATUSES[key]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="submit"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
        >
          <Filter aria-hidden="true" className="size-4" />
          Filtrar
        </button>
        {filtering && (
          <Link
            href={link({ q: "", tipo: "", estado: "", pagina: "" })}
            className={cn(chip, "min-h-9 gap-1 px-2.5 text-sm font-normal text-hub-muted hover:bg-hub-hover hover:text-hub-text")}
          >
            <X aria-hidden="true" className="size-4" />
            Limpiar
          </Link>
        )}
      </form>
    </div>
  );
}

type PaginationProps = { total: number; page: number; pageSize: number; shown: number; link: (changes: Record<string, string>) => string; sampleNote: boolean };

const pagerClass =
  "inline-flex min-h-9 items-center gap-1 rounded-lg border border-hub-border bg-hub-panel px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";

/** Paginacion por enlaces (sin JavaScript) con el conteo de registros autorizados. */
export function AcademicPagination({ total, page, pageSize, shown, link, sampleNote }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted">
      <div className="flex flex-col gap-0.5">
        <span>
          {total === 0 ? "0 registros autorizados" : `Mostrando ${shown} de ${total} registros autorizados`} · Página {page} de {lastPage}
        </span>
        {sampleNote && <span className="text-xs">Los indicadores de estado y tipo consideran los 100 productos más recientes.</span>}
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Link className={pagerClass} href={link({ pagina: String(page - 1) })}>
            Anterior
          </Link>
        )}
        {page * pageSize < total && (
          <Link className={pagerClass} href={link({ pagina: String(page + 1) })}>
            Siguiente
          </Link>
        )}
      </div>
    </nav>
  );
}
