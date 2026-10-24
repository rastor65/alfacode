import { CircleCheck, Clock, FolderKanban, Gauge, Play, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { parseSearch } from "@/features/members/types";
import { type Paginated, parsePage } from "@/features/membership/types";
import { NewProjectButton } from "@/features/projects/components/projects-list";
import { ProjectsExplorer } from "@/features/projects/components/projects-explorer";
import {
  VIEW_COOKIE_NAME,
  parseAlerts,
  parseMethodology,
  parseProjectStatus,
  parseSort,
  parseView,
  projectsHref,
  type ListFilters,
  type ProjectListSummary,
  type ProjectSummary,
} from "@/features/projects/types";
import { redirect } from "next/navigation";

import { dangerChip, eyebrow, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { plural, progressLabel } from "@/features/tracking/types";
import { serverApi } from "@/lib/api/server";
import { canPerform, getRoutePermissions } from "@/lib/auth/permissions";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Proyectos",
  robots: { index: false },
};

const PAGE_SIZE = 12;

type ProjectsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    estado?: string | string[];
    metodologia?: string | string[];
    alertas?: string | string[];
    orden?: string | string[];
    pagina?: string | string[];
  }>;
};

type ProjectsResponse = Paginated<ProjectSummary> & { summary: ProjectListSummary };

const percentOf = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : 0);

/** I-27: vista general de proyectos. Los indicadores cuentan siempre lo que la persona puede ver. */
export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await requireSessionUser("/hub/proyectos");

  if (!canPerform(user, "/hub/proyectos", "view")) {
    redirect("/hub");
  }

  const permissions = getRoutePermissions(user, "/hub/proyectos");
  const canCreate = permissions.canCreate;
  const params = await searchParams;
  const authority = isAuthority(user.roles);
  const filters: ListFilters = {
    q: parseSearch(params.q),
    status: parseProjectStatus(params.estado),
    methodology: parseMethodology(params.metodologia),
    alerts: parseAlerts(params.alertas),
    sort: parseSort(params.orden),
    page: parsePage(params.pagina),
  };

  const query = new URLSearchParams({ page: String(filters.page), pageSize: String(PAGE_SIZE), sort: filters.sort });
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);
  if (filters.methodology) query.set("methodology", filters.methodology);
  if (filters.alerts) query.set("alerts", "true");

  const [data, cookieStore] = await Promise.all([serverApi<ProjectsResponse>(`/projects?${query}`, projectsHref(filters, { page: filters.page })), cookies()]);
  const cutoff = new Date().toISOString();
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const { summary } = data;
  const active = summary.byStatus.active;

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Proyectos</h1>
              <span className={neutralChip}>{authority ? "Todos los proyectos del semillero" : "Los proyectos en los que participas"}</span>
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />
              Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá) · Calculados con la información que puedes consultar
            </p>
          </div>
          {authority && <div className="self-start md:self-auto"><NewProjectButton /></div>}
        </header>

        <dl aria-label="Indicadores de proyectos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Proyectos" icon={FolderKanban} value={summary.total} hint={plural(summary.total, "proyecto visible", "proyectos visibles")} />
          <Kpi label="En ejecución" icon={Play} value={active} tag={summary.total ? `${percentOf(active, summary.total)} %` : undefined} hint="Proyectos activos sobre el total" />
          <Kpi
            label="En riesgo"
            icon={summary.atRisk ? TriangleAlert : CircleCheck}
            tone={summary.atRisk ? "danger" : undefined}
            value={summary.atRisk}
            tag={active ? `${percentOf(summary.atRisk, active)} %` : undefined}
            hint={summary.atRisk ? "Activos con al menos una alerta" : "Ningún proyecto activo con alertas"}
          />
          <Kpi
            label="Avance de tareas"
            icon={Gauge}
            value={progressLabel(summary.tasks)}
            hint={summary.tasks.total ? `${summary.tasks.done} de ${plural(summary.tasks.total, "tarea terminada", "tareas terminadas")}` : "Aún no hay tareas registradas"}
          />
        </dl>

        <ProjectsExplorer
          items={data.items}
          summary={summary}
          filters={filters}
          total={data.total}
          cutoff={cutoff}
          initialView={parseView(cookieStore.get(VIEW_COOKIE_NAME)?.value)}
          authority={authority}
        />

        {data.total > data.pageSize && (
          <nav aria-label="Paginación" className="flex items-center justify-between text-sm">
            {filters.page > 1 ? (
              <Link href={projectsHref(filters, { page: filters.page - 1 })} className="text-hub-accent underline-offset-4 hover:underline">
                Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-hub-muted">
              Página {filters.page} de {lastPage}
            </span>
            {filters.page < lastPage ? (
              <Link href={projectsHref(filters, { page: filters.page + 1 })} className="text-hub-accent underline-offset-4 hover:underline">
                Siguiente
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, icon: Icon, value, tag, hint, tone }: { label: string; icon: LucideIcon; value: number | string; tag?: string; hint: string; tone?: "danger" }) {
  const danger = tone === "danger";
  return (
    <div className={cn(panelCard, "flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md")}>
      <div className="flex min-w-0 flex-col gap-1">
        <dt className={eyebrow}>{label}</dt>
        <dd className="flex flex-col gap-1">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className={cn("text-3xl font-semibold tabular-nums", danger ? "text-hub-field-error" : "text-hub-text")}>{value}</span>
            {tag && <span className={danger ? `${dangerChip} font-mono` : `${neutralChip} font-mono`}>{tag}</span>}
          </span>
          <span className="truncate text-xs text-hub-muted" title={hint}>{hint}</span>
        </dd>
      </div>
      <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", danger ? "bg-hub-danger-bg text-hub-field-error" : "bg-hub-accent-soft text-hub-accent")}>
        <Icon className="size-6" />
      </span>
    </div>
  );
}
