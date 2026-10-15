import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClassName } from "@/components/ui/field-styles";
import { OptionSelect } from "@/components/ui/option-select";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { ALL } from "@/features/projects/types";
import { LinesCatalog } from "@/features/research/components/lines-catalog";
import { LINE_STATUS_LABELS, type ResearchLineList, type ResearchLineStatus, parseLineStatus } from "@/features/research/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";
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
  await requireSessionUser("/hub/investigacion");
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Investigación</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Líneas de investigación</h1>
      <p className="mt-2 text-sm text-hub-muted">
        Áreas temáticas del semillero. Cada proyecto puede asociarse a una o varias desde su pestaña «Investigación».
      </p>

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      <form
        action="/hub/investigacion"
        method="get"
        role="search"
        className="mt-6 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_10rem_auto]"
      >
        <label htmlFor="q" className="text-sm font-medium text-hub-soft sm:col-start-1 sm:row-start-1">
          Buscar
        </label>
        <div className="relative sm:col-start-1 sm:row-start-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hub-muted" aria-hidden="true" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            maxLength={100}
            placeholder="Nombre de la línea"
            className={cn(selectClassName, "h-11 py-0 pl-9")}
          />
        </div>
        <label htmlFor="estado" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-2 sm:row-start-1 sm:mt-0">
          Estado
        </label>
        <div className="sm:col-start-2 sm:row-start-2">
          <OptionSelect id="estado" name="estado" options={STATUS_OPTIONS} defaultValue={filters.status ?? ALL} />
        </div>
        <button
          type="submit"
          className="mt-2 h-11 rounded-xl border border-hub-input-border bg-hub-panel px-4 text-sm font-semibold text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:col-start-3 sm:row-start-2 sm:mt-0"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-5 text-sm text-hub-muted" aria-live="polite">
        {data.total === 1 ? "1 línea" : `${data.total} líneas`}
      </p>

      <div className="mt-3">
        <LinesCatalog
          lines={data.items}
          canManage={canManage}
          emptyMessage={
            filtered
              ? "No hay líneas con esos filtros."
              : canManage
                ? "Aún no hay líneas. Crea la primera con «Nueva línea»."
                : "Aún no hay líneas de investigación registradas."
          }
        />
      </div>

      {data.total > data.pageSize && (
        <nav aria-label="Paginación" className="mt-6 flex items-center justify-between text-sm">
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
