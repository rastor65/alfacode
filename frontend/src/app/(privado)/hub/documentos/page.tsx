import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClassName } from "@/components/ui/field-styles";
import { OptionSelect } from "@/components/ui/option-select";
import { DocumentsList } from "@/features/documents/components/documents-list";
import {
  CATEGORY_LABELS,
  type DocumentCategory,
  type DocumentList,
  type DocumentScope,
  parseCategory,
  parseScope,
} from "@/features/documents/types";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { ALL } from "@/features/projects/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Documentos",
  robots: { index: false },
};

const PAGE_SIZE = 30;

const CATEGORY_OPTIONS = [{ value: ALL, label: "Todos" }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];
const SCOPE_OPTIONS = [
  { value: ALL, label: "Todos" },
  { value: "institutional", label: "Institucionales" },
  { value: "project", label: "De proyectos" },
];

type Filters = { q: string; category?: DocumentCategory; scope?: DocumentScope };

type DocumentsPageProps = {
  searchParams: Promise<{ q?: string | string[]; tipo?: string | string[]; ambito?: string | string[]; pagina?: string | string[] }>;
};

function href(filters: Filters, page = 1) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("tipo", filters.category);
  if (filters.scope) params.set("ambito", filters.scope);
  if (page > 1) params.set("pagina", String(page));

  const query = params.toString();
  return query ? `/hub/documentos?${query}` : "/hub/documentos";
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  await requireSessionUser("/hub/documentos");
  const params = await searchParams;
  const filters: Filters = { q: parseSearch(params.q), category: parseCategory(params.tipo), scope: parseScope(params.ambito) };
  const page = parsePage(params.pagina);

  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.category) query.set("category", filters.category);
  if (filters.scope) query.set("scope", filters.scope);

  const data = await serverApi<DocumentList>(`/documents?${query}`, href(filters, page));
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const filtered = Boolean(filters.q || filters.category || filters.scope);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Semillero</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Documentos</h1>
      <p className="mt-2 text-sm text-hub-muted">
        Actas, informes, certificados y evidencias que puedes consultar: los institucionales y los de tus proyectos.
      </p>

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      <form
        action="/hub/documentos"
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
            placeholder="Título o nombre del archivo"
            className={cn(selectClassName, "h-11 py-0 pl-9")}
          />
        </div>
        <label htmlFor="tipo" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-2 sm:row-start-1 sm:mt-0">
          Tipo
        </label>
        <div className="sm:col-start-2 sm:row-start-2">
          <OptionSelect id="tipo" name="tipo" options={CATEGORY_OPTIONS} defaultValue={filters.category ?? ALL} />
        </div>
        <label htmlFor="ambito" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-3 sm:row-start-1 sm:mt-0">
          Ámbito
        </label>
        <div className="sm:col-start-3 sm:row-start-2">
          <OptionSelect id="ambito" name="ambito" options={SCOPE_OPTIONS} defaultValue={filters.scope ?? ALL} />
        </div>
        <button
          type="submit"
          className="mt-2 h-11 rounded-xl border border-hub-input-border bg-hub-panel px-4 text-sm font-semibold text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:col-start-4 sm:row-start-2 sm:mt-0"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-5 text-sm text-hub-muted" aria-live="polite">
        {data.total === 1 ? "1 documento" : `${data.total} documentos`}
      </p>

      <div className="mt-3">
        <DocumentsList
          documents={data.items}
          scope="institutional"
          limits={data.upload}
          canUpload={data.permissions.canUploadInstitutional}
          showProject
          emptyMessage={
            filtered
              ? "No hay documentos con esos filtros."
              : "Aún no hay documentos que puedas consultar. Los de cada proyecto se suben desde su pestaña «Documentos»."
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
