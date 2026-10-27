import { ChartPie, Clock, Files, HardDrive, Info, Search, ShieldCheck, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { OptionSelect } from "@/components/ui/option-select";
import { Pagination } from "@/components/ui/pagination";
import { DocumentsList } from "@/features/documents/components/documents-list";
import { ACCESS_STYLE } from "@/features/documents/components/document-ui";
import { UploadDocumentButton } from "@/features/documents/components/upload-document-button";
import {
  ACCESS_LABELS,
  ACCESS_LEVELS,
  CATEGORY_LABELS,
  ORIGIN_LABELS,
  type DocumentCategory,
  type DocumentList,
  type DocumentOrigin,
  type DocumentScope,
  documentTotals,
  formatBytes,
  originTotals,
  parseCategory,
  parseScope,
} from "@/features/documents/types";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { ALL, formatCalendarDate } from "@/features/projects/types";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { KpiCard, SegmentBar } from "@/features/tracking/components/kpi-card";
import { plural } from "@/features/tracking/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";
import { bogotaDay, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Documentos",
  robots: { index: false },
};

const PAGE_SIZE = 30;

const CATEGORY_OPTIONS = [{ value: ALL, label: "Todos los tipos" }, ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))];
const SCOPE_OPTIONS = [
  { value: ALL, label: "Todos los ámbitos" },
  { value: "institutional", label: "Institucionales" },
  { value: "project", label: "De proyectos" },
];
const SCOPE_LABELS: Record<DocumentScope, string> = { institutional: "Institucionales", project: "De proyectos" };

/** Un color por origen en la barra; la leyenda con cifras lleva el mismo dato en texto. */
const ORIGIN_BAR: Record<DocumentOrigin, string> = { institutional: "bg-hub-series-1", project: "bg-hub-series-2", request: "bg-hub-series-3" };

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
  const cutoff = new Date().toISOString();
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const applied = [
    filters.q && { label: "Búsqueda", value: filters.q, remove: href({ ...filters, q: "" }) },
    filters.category && { label: "Tipo", value: CATEGORY_LABELS[filters.category], remove: href({ ...filters, category: undefined }) },
    filters.scope && { label: "Ámbito", value: SCOPE_LABELS[filters.scope], remove: href({ ...filters, scope: undefined }) },
  ].filter((item): item is { label: string; value: string; remove: string } => Boolean(item));
  const filtered = applied.length > 0;

  const { items } = data;
  const totals = documentTotals(items);
  const origins = originTotals(items);
  const shown = items.length;
  const canUpload = data.permissions.canUploadInstitutional;

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Documentos</h1>
              <span className={neutralChip}>Repositorio del semillero</span>
            </div>
            <p className="max-w-3xl text-sm text-hub-muted">Actas, informes, certificados y evidencias que puedes consultar: los institucionales y los de tus proyectos.</p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
              <Info aria-hidden="true" className="size-3.5 shrink-0 text-hub-accent" />
              Los documentos de cada proyecto se suben desde la pestaña «Documentos» de ese proyecto.
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />
              Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá) · Solo ves los documentos a los que tienes acceso
            </p>
          </div>
          {canUpload && data.upload.enabled && (
            <div className="self-start">
              <UploadDocumentButton limits={data.upload} />
            </div>
          )}
        </header>

        {canUpload && !data.upload.enabled && <Alert tone="info">El almacenamiento de documentos no está configurado en este entorno.</Alert>}

        <dl aria-label="Indicadores de documentos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Documentos"
            icon={Files}
            value={data.total}
            hint={filtered ? `Coinciden con los filtros · ${shown} en esta página` : `${plural(shown, "documento mostrado", "documentos mostrados")} en esta página`}
          />
          <KpiCard label="Origen" icon={ChartPie} scoped={shown > 0}>
            {shown === 0 ? (
              <span className="text-xs text-hub-muted">Sin documentos</span>
            ) : (
              <>
                <SegmentBar segments={(Object.keys(ORIGIN_LABELS) as DocumentOrigin[]).map((origin) => ({ className: ORIGIN_BAR[origin], share: origins[origin] / shown }))} />
                <ul className="flex flex-wrap gap-1.5">
                  {(Object.keys(ORIGIN_LABELS) as DocumentOrigin[]).map((origin) => (
                    <li key={origin} className={`${neutralChip} gap-1.5`}>
                      <span aria-hidden="true" className={cn("size-1.5 rounded-full", ORIGIN_BAR[origin])} />
                      {origins[origin]} {ORIGIN_LABELS[origin].toLowerCase()}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </KpiCard>
          <KpiCard label="Niveles de acceso" icon={ShieldCheck} scoped={shown > 0}>
            {shown === 0 ? (
              <span className="text-xs text-hub-muted">Sin documentos</span>
            ) : (
              <>
                <SegmentBar segments={ACCESS_LEVELS.map((level) => ({ className: ACCESS_STYLE[level].bar, share: totals.byAccess[level] / shown }))} />
                <ul className="flex flex-wrap gap-1.5">
                  {ACCESS_LEVELS.map((level) => {
                    const { icon: Icon, tone } = ACCESS_STYLE[level];
                    return (
                      <li key={level} className={`${tone} gap-1`}>
                        <Icon aria-hidden="true" className="size-3" />
                        {totals.byAccess[level]} {ACCESS_LABELS[level].toLowerCase()}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </KpiCard>
          <KpiCard
            label="Espacio"
            icon={HardDrive}
            scoped={shown > 0}
            value={formatBytes(totals.bytes)}
            hint={totals.latest ? `Última carga: ${formatCalendarDate(bogotaDay(totals.latest.createdAt))} · ${totals.latest.title}` : "Sin documentos"}
          />
        </dl>

        <section aria-label="Filtros de documentos" className={cn(panelCard, "flex flex-col gap-3 p-4")}>
          {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
          <form action="/hub/documentos" method="get" role="search" className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_13rem_13rem]">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="q" className={eyebrow}>
                Búsqueda rápida
              </label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={filters.q}
                  maxLength={100}
                  placeholder="Título o nombre del archivo (por ejemplo .pdf)"
                  className="h-11 w-full rounded-xl border border-hub-input-border bg-hub-input py-2 pl-9 pr-24 text-base text-hub-text placeholder:text-hub-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/70 sm:text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 min-h-8 -translate-y-1/2 rounded-lg bg-hub-accent px-3 text-xs font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-input"
                >
                  Filtrar
                </button>
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="tipo" className={eyebrow}>
                Tipo
              </label>
              <OptionSelect id="tipo" name="tipo" options={CATEGORY_OPTIONS} defaultValue={filters.category ?? ALL} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="ambito" className={eyebrow}>
                Ámbito
              </label>
              <OptionSelect id="ambito" name="ambito" options={SCOPE_OPTIONS} defaultValue={filters.scope ?? ALL} />
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-h-7 flex-wrap items-center gap-1.5">
              {filtered && (
                <>
                  <span className="mr-1 text-xs text-hub-muted">Filtros aplicados:</span>
                  {applied.map((item) => (
                    <span key={item.label} className={`${chip} gap-1 bg-hub-subtle py-1 text-hub-text`}>
                      {item.label}: <strong className="max-w-48 truncate font-semibold">{item.value}</strong>
                      <Link href={item.remove} aria-label={`Quitar el filtro de ${item.label.toLowerCase()}`} className="rounded text-hub-muted transition-colors hover:text-hub-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                        <X aria-hidden="true" className="size-3.5" />
                      </Link>
                    </span>
                  ))}
                  <Link href="/hub/documentos" className="ml-1 rounded text-xs font-medium text-hub-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                    Limpiar filtros ({applied.length})
                  </Link>
                </>
              )}
            </div>
            <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-hub-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-hub-accent" />
              {plural(data.total, "documento autorizado", "documentos autorizados")}
              {filtered ? " con los filtros actuales" : ""}
            </p>
          </div>
        </section>

        <DocumentsList
          documents={items}
          limits={data.upload}
          emptyMessage={
            filtered
              ? "No hay documentos con esos filtros."
              : "Aún no hay documentos que puedas consultar. Los de cada proyecto se suben desde su pestaña «Documentos»."
          }
        />

        {data.total > data.pageSize && (
          <Pagination page={page} lastPage={lastPage} total={data.total} shown={shown} noun={["documento autorizado", "documentos autorizados"]} hrefFor={(target) => href(filters, target)} />
        )}
      </div>
    </div>
  );
}
