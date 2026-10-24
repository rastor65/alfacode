import {
  ArrowRight, BadgeCheck, BookOpen, CalendarDays, Clock, FileText, FolderKanban, History, Hourglass, ListTodo,
  NotebookPen, PlusCircle, ShieldCheck, TriangleAlert, UserPlus, Users, type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/features/projects/types";
import { TASK_STATUS_LABELS } from "@/features/tasks/types";
import { formatDateTime } from "@/lib/format";

import { Donut } from "./components/charts";
import { chip, dangerChip, eyebrow, neutralChip, panelCard } from "./components/dashboard-ui";
import { ProjectsTable } from "./components/projects-table";
import { RiskChips } from "./components/risk-chips";
import { RefreshButton } from "./components/refresh-button";
import { OBSERVATION_KINDS, plural, progressLabel, relativeTime, type InstitutionalPanel, type OverviewPanel } from "./types";

type Project = OverviewPanel["projects"]["items"][number];
const linkClass = "font-medium text-hub-accent underline-offset-4 hover:underline";
const bogota = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", ...options });
const dayOf = bogota({ day: "2-digit" }), monthOf = bogota({ month: "short" }), timeOf = bogota({ timeStyle: "short" });
const percentOf = (part: number, total: number) => (total > 0 ? Math.round((part * 100) / total) : 0);

/** I-26 (G-01 a G-07) sobre I-01 a I-08: panel del semillero para coordinacion y administracion. */
export function OverviewPanelView({ institutional, overview, roleLabel }: { institutional: InstitutionalPanel; overview: OverviewPanel; roleLabel: string }) {
  const { pending, projects } = overview;
  const requests = pending.administrativeRequests.pending + pending.administrativeRequests.inReview;
  const pendingTotal = pending.membershipRequests + requests;
  const atRisk = projects.items.filter((project) => project.risks.length > 0);
  const active = institutional.projects.byStatus.active;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Panel general</h1>
            <span className={`${neutralChip} gap-1.5`}><ShieldCheck aria-hidden="true" className="size-3.5 text-hub-accent" />{roleLabel}</span>
          </div>
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
            <Clock aria-hidden="true" className="size-3.5" />
            Datos al <time dateTime={overview.cutoff}>{formatDateTime(overview.cutoff)}</time> (Bogotá) · Calculados con la información que puedes consultar
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <RefreshButton />
          <Link href="/hub/proyectos" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-medium text-hub-bg transition-opacity hover:opacity-90">
            <PlusCircle aria-hidden="true" className="size-4" />Nuevo proyecto
          </Link>
        </div>
      </header>

      <dl aria-label="Indicadores del semillero" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Proyectos activos" icon={FolderKanban} value={active} suffix={`/ ${institutional.projects.total}`} hint={`${projects.total} en curso · ${institutional.projects.total} totales`} bar={percentOf(active, institutional.projects.total)} href="/hub/proyectos?estado=active" />
        <Kpi label="Proyectos en riesgo" icon={TriangleAlert} tone={atRisk.length ? "danger" : undefined} value={atRisk.length} tag={atRisk.length ? "Atención" : undefined} hint={atRisk.length ? "Con al menos una alerta" : "Ninguno con alertas"} bar={percentOf(atRisk.length, active)} />
        <Kpi label="Cumplimiento" icon={BadgeCheck} value={progressLabel(institutional.tasks)} hint={`${institutional.tasks.done} terminadas de ${institutional.tasks.total}`} bar={institutional.tasks.progress ?? 0} />
        <Kpi label="Integrantes" icon={Users} value={institutional.members.active} suffix="activos" hint="Cuentas activas de todos los roles" href="/hub/integrantes" />
        <Kpi label="Pendientes gestión" icon={ListTodo} value={pendingTotal} suffix="totales" hint={`${plural(pending.membershipRequests, "solicitud", "solicitudes")} · ${plural(requests, "trámite", "trámites")}`} />
        <Kpi label="Productos" icon={BookOpen} value={institutional.products.total} suffix="registrados" hint={`${institutional.products.published} publicados o presentados`} bar={percentOf(institutional.products.published, institutional.products.total)} href="/hub/produccion" />
      </dl>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className={`${panelCard} p-6 lg:col-span-7`}>
          <CardHeader title="Distribución por fases" subtitle={`Estado actual de los ${plural(institutional.projects.total, "proyecto registrado", "proyectos registrados")}`}
            aside={<span className={neutralChip}>{institutional.projects.total} total</span>} />
          <PhaseBars counts={institutional.projects.byStatus} total={institutional.projects.total} />
        </div>
        <div className={`${panelCard} p-6 lg:col-span-5`}>
          <CardHeader title="Estado de tareas" subtitle={`${plural(institutional.tasks.total, "tarea registrada", "tareas registradas")} en todos los proyectos`} />
          <Donut labels={TASK_STATUS_LABELS} counts={institutional.tasks.byStatus} empty="Aún no hay tareas registradas." centerLabel="Tareas" />
        </div>
      </section>

      <section aria-labelledby="risk-title" className={`${panelCard} flex flex-col gap-4 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span aria-hidden="true" className={atRisk.length ? "size-2.5 rounded-full bg-hub-field-error" : "size-2.5 rounded-full bg-hub-chart"} />
            <h2 id="risk-title" className="text-lg font-semibold text-hub-text">Proyectos en riesgo ({atRisk.length})</h2>
            {atRisk.length > 0 && <span className={dangerChip}>Acción prioritaria</span>}
          </div>
          <a href="#proyectos-en-curso" className="inline-flex items-center gap-1 text-sm font-medium text-hub-accent hover:underline">Ver todos los proyectos<ArrowRight aria-hidden="true" className="size-3.5" /></a>
        </div>
        <p className="-mt-2 text-xs text-hub-muted">Alertas operativas de proyectos activos para priorizar el acompañamiento; no evalúan al equipo.</p>
        {atRisk.length ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {atRisk.map((project) => <RiskCard key={project.id} project={project} />)}
          </ul>
        ) : <p className="rounded-xl border border-dashed border-hub-border px-4 py-6 text-center text-sm text-hub-muted">Ningún proyecto activo presenta alertas.</p>}
      </section>

      <section id="proyectos-en-curso" aria-labelledby="projects-title" className={`${panelCard} flex scroll-mt-24 flex-col gap-4 p-6`}>
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 id="projects-title" className="text-lg font-semibold text-hub-text">Proyectos en curso ({projects.total})</h2>
          <span className="text-xs text-hub-muted">Propuestos, en planificación, activos y pausados</span>
          <Link href="/hub/reportes" className="ml-auto text-sm text-hub-accent underline-offset-4 hover:underline">Reportes filtrables</Link>
        </div>
        <ProjectsTable items={projects.items} cutoff={overview.cutoff} />
        {projects.total > projects.items.length && <p className="text-xs text-hub-muted">El panel incluye {projects.items.length} de {projects.total}; consulta los reportes para ver todos.</p>}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${panelCard} p-6`}>
          <CardHeader icon={NotebookPen} title="Pendientes de gestión" aside={<span className={neutralChip}>{plural(pendingTotal, "requerimiento", "requerimientos")}</span>} />
          <ul className="mt-3 flex flex-col gap-2">
            <PendingItem icon={UserPlus} title="Solicitudes de ingreso" detail="Personas que pidieron unirse al semillero" value={pending.membershipRequests} tag="nuevas" href="/hub/solicitudes" />
            <PendingItem icon={FileText} title="Trámites pendientes" detail="Solicitudes administrativas sin revisar" value={pending.administrativeRequests.pending} tag="por revisar" href="/hub/tramites?vista=review&estado=pending" />
            <PendingItem icon={Hourglass} title="Trámites en revisión" detail="Con revisión en curso, a la espera de decisión" value={pending.administrativeRequests.inReview} tag="en revisión" href="/hub/tramites?vista=review&estado=in_review" />
          </ul>
        </div>
        <div className={`${panelCard} p-6`}>
          <CardHeader icon={CalendarDays} title="Agenda del semillero" aside={<Link href="/hub/actividades" className="text-sm text-hub-accent hover:underline">Calendario</Link>} />
          {overview.agenda.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {overview.agenda.map((event) => (
                <li key={event.id} className="flex items-center gap-3 rounded-lg bg-hub-subtle p-2 transition-colors hover:bg-hub-hover">
                  <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                    <span className="text-base font-semibold leading-none">{dayOf.format(new Date(event.startsAt))}</span>
                    <span className="text-[10px] uppercase">{monthOf.format(new Date(event.startsAt)).replace(".", "")}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={event.project ? `/hub/proyectos/${event.project.id}/actividades` : "/hub/actividades"} className="block truncate text-sm font-medium text-hub-text hover:underline">{event.title}</Link>
                    <p className="truncate text-[11px] text-hub-muted"><time dateTime={event.startsAt}>{timeOf.format(new Date(event.startsAt))}</time> · {event.project?.name ?? "Institucional"}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-hub-muted">No hay actividades programadas.</p>}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${panelCard} p-6`}>
          <CardHeader icon={History} title="Observaciones recientes" />
          {overview.recent.observations.length ? (
            <ul className="mt-3 flex flex-col divide-y divide-hub-border">
              {overview.recent.observations.map((item) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-hub-muted">
                    <span className={neutralChip}>{OBSERVATION_KINDS[item.kind]}</span>
                    <Link href={`/hub/proyectos/${item.project.id}/seguimiento`} className={linkClass}>{item.project.name}</Link>
                    <span>· {item.author ?? "Autor no disponible"} · <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>{relativeTime(item.createdAt, overview.cutoff) ?? formatDateTime(item.createdAt)}</time></span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 whitespace-pre-line break-words text-sm text-hub-text">{item.excerpt}</p>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-hub-muted">Aún no hay observaciones de seguimiento.</p>}
        </div>
        <div className={`${panelCard} p-6`}>
          <CardHeader icon={BookOpen} title="Productos registrados recientemente" aside={<Link href="/hub/produccion" className="text-sm text-hub-accent hover:underline">Ver todos</Link>} />
          {overview.recent.products.length ? (
            <ul className="mt-3 flex flex-col divide-y divide-hub-border">
              {overview.recent.products.map((product) => (
                <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-hub-text">{product.title}</p>
                    <p className="text-[11px] text-hub-muted">{product.project?.name ?? "Sin proyecto"} · <time dateTime={product.createdAt}>{formatDateTime(product.createdAt)}</time></p>
                  </div>
                  <span className={neutralChip}>{PRODUCT_STATUSES[product.status]}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-hub-muted">Aún no hay productos registrados.</p>}
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, icon: Icon, value, suffix, tag, hint, bar, tone, href }: {
  label: string; icon: LucideIcon; value: number | string; suffix?: string; tag?: string; hint: string; bar?: number; tone?: "danger"; href?: string;
}) {
  const danger = tone === "danger";
  return (
    <div className={`${panelCard} relative flex flex-col justify-between gap-2 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <dt className={eyebrow}>{href ? <Link href={href} className="after:absolute after:inset-0 hover:text-hub-text">{label}</Link> : label}</dt>
        <Icon aria-hidden="true" className={danger ? "size-4.5 text-hub-field-error" : "size-4.5 text-hub-accent"} />
      </div>
      <dd>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className={danger ? "text-3xl font-semibold tabular-nums text-hub-field-error" : "text-3xl font-semibold tabular-nums text-hub-text"}>{value}</span>
          {suffix && <span className="text-[11px] text-hub-muted">{suffix}</span>}
          {tag && <span className={dangerChip}>{tag}</span>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-hub-muted" title={hint}>{hint}</p>
      </dd>
      <dd aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-hub-border">
        {bar !== undefined && <div className={danger ? "h-full rounded-full bg-hub-field-error" : "h-full rounded-full bg-hub-chart"} style={{ width: `${bar}%` }} />}
      </dd>
    </div>
  );
}

function CardHeader({ title, subtitle, icon: Icon, aside }: { title: string; subtitle?: string; icon?: LucideIcon; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-hub-text">{Icon && <Icon aria-hidden="true" className="size-4.5 text-hub-accent" />}{title}</h2>
        {subtitle && <p className="text-[11px] text-hub-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

/** I-02 por fase: la etapa activa se destaca; las demas comparten un tono atenuado de la misma serie. */
function PhaseBars({ counts, total }: { counts: Record<ProjectStatus, number>; total: number }) {
  if (total === 0) return <p className="mt-3 text-sm text-hub-muted">Sin datos registrados.</p>;
  return (
    <dl className="mt-4 flex flex-col gap-2.5">
      {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => {
        const value = counts[status], highlight = status === "active";
        return (
          <div key={status} className="flex items-center gap-3">
            <dt className={highlight ? "w-32 truncate text-[13px] font-semibold text-hub-text" : "w-32 truncate text-[13px] text-hub-muted"}>{PROJECT_STATUS_LABELS[status]}</dt>
            <dd aria-hidden="true" className="h-2.5 flex-1 overflow-hidden rounded-full bg-hub-border">
              {value > 0 && <div className={highlight ? "h-full rounded-full bg-hub-chart" : "h-full rounded-full bg-hub-chart/45"} style={{ width: `${Math.max(2, (value * 100) / total)}%` }} />}
            </dd>
            <dd className={highlight ? "w-8 text-right font-mono text-[13px] font-bold text-hub-accent" : "w-8 text-right font-mono text-[13px] font-medium text-hub-text"}>{value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Cada alerta lleva icono y texto: el color nunca es la unica senal. */
function RiskCard({ project }: { project: Project }) {
  return (
    <li className="flex flex-col justify-between gap-4 rounded-xl bg-hub-subtle p-4 shadow-sm transition-shadow hover:shadow">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={chip + " bg-hub-badge-bg text-hub-muted"}>{PROJECT_STATUS_LABELS[project.status]}</span>
          <span className={project.risks.length > 1 ? `${dangerChip} rounded-full` : `${neutralChip} rounded-full`}>{plural(project.risks.length, "alerta", "alertas")}</span>
        </div>
        <h3 className="break-words text-base font-semibold leading-snug text-hub-text">{project.name}</h3>
        <p className="text-[13px] text-hub-muted">{project.leaders.length ? `Líder: ${project.leaders.map((leader) => leader.fullName).join(", ")}` : "Sin líder asignado"}</p>
      </div>
      <div className="flex flex-col gap-2">
        <RiskChips project={project} />
        <Link href={`/hub/proyectos/${project.id}/seguimiento`} className="mt-1 rounded-lg bg-hub-hover px-3 py-1.5 text-center text-[13px] font-medium text-hub-text transition-colors hover:bg-hub-accent-soft">
          Detalles<span className="sr-only"> de {project.name}</span>
        </Link>
      </div>
    </li>
  );
}

function PendingItem({ icon: Icon, title, detail, value, tag, href }: { icon: LucideIcon; title: string; detail: string; value: number; tag: string; href: string }) {
  return (
    <li className="relative flex items-center justify-between gap-3 rounded-lg bg-hub-subtle p-2 transition-colors hover:bg-hub-hover">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent"><Icon aria-hidden="true" className="size-4" /></span>
        <div className="min-w-0">
          <Link href={href} className="text-[13px] font-medium text-hub-text after:absolute after:inset-0">{title}</Link>
          <p className="truncate text-[11px] text-hub-muted">{detail}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={value ? `${chip} rounded-full bg-hub-accent font-bold text-hub-bg` : `${neutralChip} rounded-full`}>{value} {tag}</span>
        <ArrowRight aria-hidden="true" className="size-4 text-hub-muted" />
      </div>
    </li>
  );
}
