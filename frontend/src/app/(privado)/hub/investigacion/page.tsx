import { CheckCircle2, Clock, FlaskConical, FolderKanban, LucideIcon, PauseCircle, Search, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClassName } from "@/components/ui/field-styles";
import { OptionSelect } from "@/components/ui/option-select";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { ALL } from "@/features/projects/types";
import { LinesCatalog } from "@/features/research/components/lines-catalog";
import { LINE_STATUS_LABELS, type ResearchLineList, type ResearchLineStatus, parseLineStatus } from "@/features/research/types";
import { eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Líneas de investigación",
  robots: { index: false },
};

const PAGE_SIZE = 50;

const STATUS_OPTIONS = [
  { value: ALL, label: "Todas" },
  ...Object.entries(LINE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

type Filters = { q: string; status?: ResearchLineStatus };

type ResearchPageProps = {
  searchParams: Promise<{ q?: string | string[]; estado?: string | string[]; pagina?: string | string[] }>;
};

function href(filters: Filters, page = 1) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("estado", filters.status);
  if (page > 1) params.set("pagina", String(page));

  const query = params.toString();
  return query ? `/hub/investigacion?${query}` : "/hub/investigacion";
}

export default async function ResearchLinesPage({ searchParams }: ResearchPageProps) {
  const user = await requireSessionUser("/hub/investigacion");
  const params = await searchParams;
  const filters: Filters = { q: parseSearch(params.q), status: parseLineStatus(params.estado) };
  const page = parsePage(params.pagina);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);

  const data = await serverApi<ResearchLineList>(`/research-lines?${query}`, href(filters, page));
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const filtered = Boolean(filters.q || filters.status);
  const canManage = data.permissions.canManageLines;
  const authority = isAuthority(user.roles);
  const cutoff = new Date().toISOString();

  // Métricas rápidas sobre los elementos cargados
  const activeCount = data.items.filter((item) => item.status === "active").length;
  const inactiveCount = data.items.filter((item) => item.status === "inactive").length;
  const totalProjectsLinked = data.items.reduce((acc, item) => acc + (item.projectCount || 0), 0);

  return (
    <div className="mx-auto w-full max-w-430 flex flex-col gap-6">
      {/* Encabezado */}
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Líneas de investigación</h1>
            <span className={neutralChip}>
              {authority ? "Catálogo institucional completo" : "Consulta institucional"}
            </span>
            {canManage && (
              <span className="inline-flex items-center gap-1 rounded bg-hub-accent-soft px-2 py-0.5 text-[11px] font-medium leading-4 text-hub-accent">
                <ShieldCheck className="size-3" />
                Permiso de gestión activo
              </span>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
            <Clock aria-hidden="true" className="size-3.5" />
            Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá) · Áreas temáticas del semillero AlfaCode
          </p>
        </div>
      </header>

      {/* Indicadores clave */}
      <dl aria-label="Indicadores de líneas de investigación" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Líneas registradas"
          icon={FlaskConical}
          value={data.total}
          hint={data.total === 1 ? "1 línea en catálogo" : `${data.total} líneas en catálogo`}
        />
        <Kpi
          label="Líneas activas"
          icon={CheckCircle2}
          value={activeCount}
          hint="Disponibles para vincular a proyectos"
        />
        <Kpi
          label="Líneas inactivas"
          icon={PauseCircle}
          value={inactiveCount}
          hint="Históricas o en pausa"
        />
        <Kpi
          label="Proyectos vinculados"
          icon={FolderKanban}
          value={totalProjectsLinked}
          hint="Asignaciones totales en proyectos"
        />
      </dl>

      {/* Barra de búsqueda y filtros */}
      <div className={cn(panelCard, "p-4")}>
        <form
          action="/hub/investigacion"
          method="get"
          role="search"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1">
            <label htmlFor="q" className="text-xs font-medium text-hub-soft">
              Buscar línea de investigación
            </label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hub-muted" aria-hidden="true" />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={filters.q}
                maxLength={100}
                placeholder="Nombre de la línea temática..."
                className={cn(selectClassName, "h-10 py-0 pl-9 bg-hub-subtle text-sm")}
              />
            </div>
          </div>

          <div className="w-full sm:w-44 space-y-1">
            <label htmlFor="estado" className="text-xs font-medium text-hub-soft">
              Estado
            </label>
            <OptionSelect id="estado" name="estado" options={STATUS_OPTIONS} defaultValue={filters.status ?? ALL} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="h-10 rounded-xl border border-hub-border bg-hub-panel px-4 text-sm font-semibold text-hub-text transition hover:bg-hub-hover hover:border-cyan-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              Filtrar
            </button>
            {filtered && (
              <Link
                href="/hub/investigacion"
                className="h-10 inline-flex items-center rounded-xl px-3 text-xs font-medium text-hub-muted hover:text-hub-text transition"
              >
                Limpiar
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Catálogo de líneas */}
      <LinesCatalog
        lines={data.items}
        canManage={canManage}
        emptyMessage={
          filtered
            ? "No hay líneas con los filtros seleccionados."
            : canManage
              ? "Aún no hay líneas de investigación creadas. Agrega la primera con «Nueva línea de investigación»."
              : "Aún no hay líneas de investigación registradas en el catálogo."
        }
      />

      {/* Paginación */}
      {data.total > data.pageSize && (
        <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href(filters, page - 1)} className="text-hub-accent underline-offset-4 hover:underline">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-hub-muted">
            Página {page} de {lastPage}
          </span>
          {page < lastPage ? (
            <Link href={href(filters, page + 1)} className="text-hub-accent underline-offset-4 hover:underline">
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

function Kpi({ label, icon: Icon, value, hint }: { label: string; icon: LucideIcon; value: number | string; hint: string }) {
  return (
    <div className={cn(panelCard, "flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md")}>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className={eyebrow}>{label}</dt>
        <dd className="flex flex-col gap-1">
          <span className="text-3xl font-semibold tabular-nums text-hub-text">{value}</span>
          <span className="truncate text-xs text-hub-muted" title={hint}>{hint}</span>
        </dd>
      </div>
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
        <Icon className="size-6" />
      </span>
    </div>
  );
}
