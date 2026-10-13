import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClassName } from "@/components/ui/field-styles";
import { OptionSelect } from "@/components/ui/option-select";
import { parseSearch } from "@/features/members/types";
import { type Paginated, parsePage } from "@/features/membership/types";
import { NewProjectButton, ProjectsList } from "@/features/projects/components/projects-list";
import {
  ALL,
  METHODOLOGY_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectMethodology,
  type ProjectStatus,
  type ProjectSummary,
  parseMethodology,
  parseProjectStatus,
} from "@/features/projects/types";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Proyectos",
  robots: { index: false },
};

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: ALL, label: "Todos" },
  ...Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const METHODOLOGY_OPTIONS = [
  { value: ALL, label: "Todas" },
  ...Object.entries(METHODOLOGY_LABELS).map(([value, label]) => ({ value, label })),
];

type Filters = { q: string; status?: ProjectStatus; methodology?: ProjectMethodology };

type ProjectsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    estado?: string | string[];
    metodologia?: string | string[];
    pagina?: string | string[];
  }>;
};

function href(filters: Filters, page = 1) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("estado", filters.status);
  if (filters.methodology) params.set("metodologia", filters.methodology);
  if (page > 1) params.set("pagina", String(page));

  const query = params.toString();
  return query ? `/hub/proyectos?${query}` : "/hub/proyectos";
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await requireSessionUser("/hub/proyectos");
  const params = await searchParams;
  const authority = isAuthority(user.roles);
  const filters: Filters = {
    q: parseSearch(params.q),
    status: parseProjectStatus(params.estado),
    methodology: parseMethodology(params.metodologia),
  };
  const page = parsePage(params.pagina);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);
  if (filters.methodology) query.set("methodology", filters.methodology);

  const data = await serverApi<Paginated<ProjectSummary>>(`/projects?${query}`, href(filters, page));
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const filtered = Boolean(filters.q || filters.status || filters.methodology);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Semillero</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Proyectos</h1>
      <p className="mt-2 text-sm text-hub-muted">
        {authority ? "Todos los proyectos del semillero." : "Los proyectos en los que participas."}
      </p>

      {authority && (
        <div className="mt-6">
          <NewProjectButton />
        </div>
      )}

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      <form
        action="/hub/proyectos"
        method="get"
        role="search"
        className="mt-6 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_10rem_9rem_auto]"
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
            placeholder="Nombre del proyecto"
            className={cn(selectClassName, "h-11 py-0 pl-9")}
          />
        </div>
        <label htmlFor="estado" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-2 sm:row-start-1 sm:mt-0">
          Estado
        </label>
        <div className="sm:col-start-2 sm:row-start-2">
          <OptionSelect id="estado" name="estado" options={STATUS_OPTIONS} defaultValue={filters.status ?? ALL} />
        </div>
        <label htmlFor="metodologia" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-3 sm:row-start-1 sm:mt-0">
          Metodología
        </label>
        <div className="sm:col-start-3 sm:row-start-2">
          <OptionSelect id="metodologia" name="metodologia" options={METHODOLOGY_OPTIONS} defaultValue={filters.methodology ?? ALL} />
        </div>
        <button
          type="submit"
          className="mt-2 h-11 rounded-xl border border-hub-input-border bg-hub-panel px-4 text-sm font-semibold text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:col-start-4 sm:row-start-2 sm:mt-0"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-5 text-sm text-hub-muted" aria-live="polite">
        {data.total === 1 ? "1 proyecto" : `${data.total} proyectos`}
      </p>

      {data.items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          {filtered
            ? "No hay proyectos con esos filtros."
            : authority
              ? "Aún no hay proyectos. Crea el primero con «Nuevo proyecto»."
              : "Todavía no participas en ningún proyecto."}
        </p>
      ) : (
        <ProjectsList projects={data.items} />
      )}

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
