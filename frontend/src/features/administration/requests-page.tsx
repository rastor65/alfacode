import { CircleAlert, Clock, Files, Hourglass, Inbox, ListChecks, Paperclip, RefreshCw, Search, ShieldCheck, ClipboardCheck, X } from "lucide-react";
import Link from "next/link";

import { OptionSelect } from "@/components/ui/option-select";
import { Pagination } from "@/components/ui/pagination";
import { parseSearch } from "@/features/members/types";
import { parsePage } from "@/features/membership/types";
import { chip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { KpiCard } from "@/features/tracking/components/kpi-card";
import { plural } from "@/features/tracking/types";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { NewRequestButton } from "./components/new-request-button";
import { RequestsCatalog } from "./components/requests-catalog";
import { knownKey, REQUEST_STATUSES, REQUEST_TYPES, requestTotals, type RequestList } from "./types";

export type RequestSearch = Record<string, string | string[] | undefined>;

const PATH = "/hub/tramites";
const PAGE_SIZE = 20;
const ALL = "all";
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const TYPE_OPTIONS = [{ value: ALL, label: "Todos los tipos" }, ...Object.entries(REQUEST_TYPES).map(([value, label]) => ({ value, label }))];
const STATUS_OPTIONS = [{ value: ALL, label: "Todos los estados" }, ...Object.entries(REQUEST_STATUSES).map(([value, label]) => ({ value, label }))];

const POLICIES = [
  { icon: Paperclip, title: "Adjuntos y soportes", text: "Los soportes se adjuntan dentro del trámite, una vez registrado. Solo los ven la persona solicitante y la coordinación." },
  { icon: ClipboardCheck, title: "Certificados", text: "Los certificados se preparan de forma manual. La respuesta de la coordinación queda en el historial del trámite." },
  { icon: ShieldCheck, title: "Cambios en el sistema", text: "Aprobar cambios de datos o responsabilidades no los aplica automáticamente: la coordinación registra su ejecución." },
];

/** Trámites y solicitudes: bandeja propia y, para las autoridades, bandeja de revisión. */
export async function RequestsPage({ searchParams }: { searchParams: Promise<RequestSearch> }) {
  const user = await requireSessionUser(PATH);
  const params = await searchParams;
  const authority = isAuthority(user.roles);
  const view = authority && first(params.vista) === "review" ? "review" : "mine";
  const type = knownKey(REQUEST_TYPES, params.tipo);
  const status = knownKey(REQUEST_STATUSES, params.estado);
  const q = parseSearch(params.q);
  const assignedToMe = view === "review" && first(params.responsable) === "me";
  const page = parsePage(params.pagina);

  const query = new URLSearchParams({ view, page: String(page), pageSize: String(PAGE_SIZE) });
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  if (assignedToMe) query.set("reviewerId", user.id);

  const data = await serverApi<RequestList>(`/administrative-requests?${query}`, PATH);
  const cutoff = new Date().toISOString();
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  /** Enlace a esta misma vista con otros parametros; un valor vacio quita el parametro. */
  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single) next.set(key, single);
    }

    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    const text = next.toString();
    return text ? `${PATH}?${text}` : PATH;
  };

  const applied = [
    q && { label: "Búsqueda", value: q, remove: link({ q: "", pagina: "" }) },
    type && { label: "Tipo", value: REQUEST_TYPES[type], remove: link({ tipo: "", pagina: "" }) },
    status && { label: "Estado", value: REQUEST_STATUSES[status], remove: link({ estado: "", pagina: "" }) },
    assignedToMe && { label: "Responsable", value: "Yo", remove: link({ responsable: "", pagina: "" }) },
  ].filter((item): item is { label: string; value: string; remove: string } => Boolean(item));
  const filtered = applied.length > 0;
  const clear = link({ q: "", tipo: "", estado: "", responsable: "", pagina: "" });

  const { items } = data;
  const shown = items.length;
  const totals = requestTotals(items);
  const reviewing = view === "review";

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Trámites y solicitudes</h1>
              <span className={neutralChip}>Gestión administrativa</span>
            </div>
            <p className="max-w-3xl text-sm text-hub-muted">
              Consulta tus peticiones, respuestas y soportes. Las solicitudes de ingreso se gestionan en{" "}
              {authority ? (
                <Link href="/hub/solicitudes" className="font-medium text-hub-accent underline underline-offset-4 hover:opacity-80">
                  Vinculaciones
                </Link>
              ) : (
                "Vinculaciones"
              )}
              .
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />
              Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá)
            </p>
          </div>
          <div className="self-start">
            <NewRequestButton />
          </div>
        </header>

        {authority && (
          <nav aria-label="Bandeja de trámites" className="-mx-1 overflow-x-auto px-1 pb-1">
            <ul className="flex min-w-max items-center gap-1.5 rounded-xl bg-hub-subtle p-1">
              {(
                [
                  { value: "mine", label: "Mis solicitudes", icon: Inbox },
                  { value: "review", label: "Bandeja de revisión", icon: ListChecks },
                ] as const
              ).map((tab) => {
                const current = tab.value === view;
                return (
                  <li key={tab.value}>
                    <Link
                      href={link({ vista: tab.value, pagina: "", responsable: "" })}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                        current ? "bg-hub-accent font-semibold text-hub-bg shadow-sm" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                      )}
                    >
                      <tab.icon aria-hidden="true" className="size-4" />
                      {tab.label}
                      {current && <span className="rounded-md bg-hub-bg/20 px-1.5 py-0.5 font-mono text-[11px]">{data.total}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <dl aria-label="Indicadores de solicitudes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={reviewing ? "Solicitudes por revisar" : "Mis solicitudes"}
            icon={Files}
            value={data.total}
            hint={filtered ? `Coinciden con los filtros · ${shown} en esta página` : `${plural(shown, "solicitud mostrada", "solicitudes mostradas")} en esta página`}
          />
          <KpiCard label="Pendientes" icon={Hourglass} scoped={shown > 0} value={totals.byStatus.pending} hint="Esperan que alguien las revise" />
          <KpiCard label="En revisión" icon={RefreshCw} scoped={shown > 0} value={totals.byStatus.in_review} hint="Con revisión iniciada" />
          {reviewing ? (
            <KpiCard
              label="Sin responsable"
              icon={totals.unassigned ? CircleAlert : ShieldCheck}
              tone={totals.unassigned ? "danger" : undefined}
              scoped={shown > 0}
              value={totals.unassigned}
              hint={totals.unassigned ? "Abiertas que requieren asignación" : "Todas las abiertas tienen responsable"}
            />
          ) : (
            <KpiCard label="Resueltas" icon={ShieldCheck} scoped={shown > 0} value={totals.resolved} hint="Aprobadas, rechazadas o completadas" />
          )}
        </dl>

        <section aria-label="Filtros de solicitudes" className={cn(panelCard, "flex flex-col gap-3 p-4")}>
          {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
          <form action={PATH} method="get" role="search" className="grid grid-cols-1 items-end gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_13rem_13rem_auto]">
            <input type="hidden" name="vista" value={view} />
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
                  defaultValue={q}
                  maxLength={100}
                  placeholder="Buscar por asunto o palabra clave"
                  className="h-11 w-full rounded-xl border border-hub-input-border bg-hub-input py-2 pl-9 pr-3 text-base text-hub-text placeholder:text-hub-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/70 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="filter-request-type" className={eyebrow}>
                Tipo
              </label>
              <OptionSelect id="filter-request-type" name="tipo" defaultValue={type ?? ALL} options={TYPE_OPTIONS} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor="filter-request-status" className={eyebrow}>
                Estado
              </label>
              <OptionSelect id="filter-request-status" name="estado" defaultValue={status ?? ALL} options={STATUS_OPTIONS} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {reviewing && (
                <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-sm font-medium text-hub-text">
                  <input type="checkbox" name="responsable" value="me" defaultChecked={assignedToMe} className="size-4 cursor-pointer accent-(--hub-accent)" />
                  Asignadas a mí
                </label>
              )}
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-hub-accent px-5 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-panel"
              >
                Filtrar
              </button>
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
                  <Link href={clear} className="ml-1 rounded text-xs font-medium text-hub-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent">
                    Limpiar filtros ({applied.length})
                  </Link>
                </>
              )}
            </div>
            <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-hub-muted">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-hub-accent" />
              {plural(data.total, "solicitud autorizada", "solicitudes autorizadas")}
              {filtered ? " con los filtros actuales" : ""}
            </p>
          </div>
        </section>

        <RequestsCatalog items={items} emptyMessage="No hay solicitudes para los filtros actuales." />

        {data.total > data.pageSize && (
          <Pagination
            page={data.page}
            lastPage={lastPage}
            total={data.total}
            shown={shown}
            noun={["solicitud autorizada", "solicitudes autorizadas"]}
            label="Paginación de solicitudes"
            hrefFor={(target) => link({ pagina: target > 1 ? String(target) : "" })}
          />
        )}

        <aside aria-label="Políticas de trámites" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {POLICIES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={cn(panelCard, "flex flex-col gap-2 p-4")}>
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                <Icon className="size-4" />
              </span>
              <h2 className="text-sm font-semibold text-hub-text">{title}</h2>
              <p className="text-xs leading-relaxed text-hub-muted">{text}</p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
