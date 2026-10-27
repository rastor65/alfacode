import { CircleCheck, CircleX, Clock, FileText, Inbox, MailCheck, Timer, UserCheck, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Pagination } from "@/components/ui/pagination";
import { RequestsBoard } from "@/features/membership/components/requests-board";
import {
  type MembershipRequestItem,
  type MembershipRequestStatus,
  type Paginated,
  REQUEST_STATUS_LABELS,
  parsePage,
  parseRequestStatus,
  requestStats,
} from "@/features/membership/types";
import { neutralChip } from "@/features/tracking/components/dashboard-ui";
import { KpiCard } from "@/features/tracking/components/kpi-card";
import { plural, relativeTime } from "@/features/tracking/types";
import { serverApi } from "@/lib/api/server";
import { canPerform } from "@/lib/auth/permissions";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Solicitudes",
  robots: { index: false },
};

const PAGE_SIZE = 20;
const STATUSES = Object.keys(REQUEST_STATUS_LABELS) as MembershipRequestStatus[];

const EMPTY_MESSAGES: Record<MembershipRequestStatus, string> = {
  pending: "No hay solicitudes pendientes.",
  approved: "Aún no se ha aprobado ninguna solicitud.",
  rejected: "No hay solicitudes rechazadas.",
};

const TAB_ICONS: Record<MembershipRequestStatus, LucideIcon> = { pending: Inbox, approved: CircleCheck, rejected: CircleX };

type RequestsPageProps = {
  searchParams: Promise<{ estado?: string | string[]; pagina?: string | string[] }>;
};

function href(status: MembershipRequestStatus, page = 1) {
  const params = new URLSearchParams();

  if (status !== "pending") {
    params.set("estado", status);
  }
  if (page > 1) {
    params.set("pagina", String(page));
  }

  const query = params.toString();
  return query ? `/hub/solicitudes?${query}` : "/hub/solicitudes";
}

/** Dias completos entre dos instantes; 0 es "hoy". */
function daysBetween(from: string, to: string) {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000));
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const user = await requireSessionUser("/hub/solicitudes");

  if (!canPerform(user, "/hub/solicitudes", "view")) {
    redirect("/hub");
  }

  const params = await searchParams;
  const status = parseRequestStatus(params.estado);
  const page = parsePage(params.pagina);
  const path = (target: MembershipRequestStatus, number: number, size: number) => `/membership-requests?status=${target}&page=${number}&pageSize=${size}`;

  // Las pestañas muestran cuantas solicitudes tiene cada estado: una consulta de una fila por cada otro estado.
  const [data, ...others] = await Promise.all([
    serverApi<Paginated<MembershipRequestItem>>(path(status, page, PAGE_SIZE), href(status, page)),
    ...STATUSES.filter((value) => value !== status).map((value) => serverApi<Paginated<MembershipRequestItem>>(path(value, 1, 1), href(status, page))),
  ]);
  const counts = Object.fromEntries(
    [status, ...STATUSES.filter((value) => value !== status)].map((value, index) => [value, index === 0 ? data.total : others[index - 1]!.total]),
  ) as Record<MembershipRequestStatus, number>;

  const cutoff = new Date().toISOString();
  const dates = Object.fromEntries(
    data.items.map((item) => [
      item.id,
      { created: formatDateTime(item.createdAt), reviewed: item.reviewedAt ? formatDateTime(item.reviewedAt) : null },
    ]),
  );
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const shown = data.items.length;
  const stats = requestStats(data.items);
  const percent = (part: number) => `${Math.round((part * 100) / shown)} %`;
  const pending = status === "pending";

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-hub-text">Solicitudes de acceso</h1>
              <span className={neutralChip}>Gestión de identidades</span>
            </div>
            <p className="max-w-3xl text-sm text-hub-muted">
              Al aprobar una solicitud, la cuenta se activa con el rol elegido y la persona recibe una contraseña temporal en su correo institucional.{" "}
              <Link href="/hub/integrantes" className="font-medium text-hub-accent underline underline-offset-4 hover:opacity-80">
                Gestionar integrantes activos
              </Link>
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />
              Datos al <time dateTime={cutoff}>{formatDateTime(cutoff)}</time> (Bogotá)
            </p>
          </div>
        </header>

        <nav aria-label="Estado de las solicitudes" className="-mx-1 overflow-x-auto px-1 pb-1">
          <ul className="flex min-w-max items-center gap-1.5 rounded-xl bg-hub-subtle p-1">
            {STATUSES.map((value) => {
              const current = value === status;
              const Icon = TAB_ICONS[value];
              return (
                <li key={value}>
                  <Link
                    href={href(value)}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex min-h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                      current ? "bg-hub-accent font-semibold text-hub-bg shadow-sm" : "text-hub-muted hover:bg-hub-hover hover:text-hub-text",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {REQUEST_STATUS_LABELS[value]}
                    <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-[11px]", current ? "bg-hub-bg/20" : "bg-hub-border text-hub-muted")}>{counts[value]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <dl aria-label="Indicadores de solicitudes" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={pending ? "Total en cola" : `Solicitudes ${REQUEST_STATUS_LABELS[status].toLowerCase()}`}
            icon={Inbox}
            value={data.total}
            hint={`${plural(shown, "solicitud mostrada", "solicitudes mostradas")} en esta página`}
          />
          <KpiCard
            label="Con Hoja de Vida"
            icon={FileText}
            scoped={shown > 0}
            value={shown ? `${stats.withCv}/${shown}` : "—"}
            hint={shown ? `${plural(shown - stats.withCv, "sin Hoja de Vida", "sin Hoja de Vida")} · ${percent(stats.withCv)}` : "Sin solicitudes"}
          />
          <KpiCard
            label="Correos verificados"
            icon={MailCheck}
            scoped={shown > 0}
            value={shown ? `${stats.verified}/${shown}` : "—"}
            hint={shown ? (stats.verified === shown ? "Todos los correos están verificados" : `${plural(shown - stats.verified, "sin verificar", "sin verificar")} · ${percent(stats.verified)} verificado`) : "Sin solicitudes"}
          />
          {pending ? (
            <KpiCard
              label="Mayor tiempo de espera"
              icon={Timer}
              scoped={shown > 0}
              value={stats.oldest ? (daysBetween(stats.oldest, cutoff) === 0 ? "Hoy" : plural(daysBetween(stats.oldest, cutoff), "día", "días")) : "—"}
              hint={stats.oldest ? `Radicada ${formatDateTime(stats.oldest)}` : "Sin solicitudes pendientes"}
            />
          ) : (
            <KpiCard
              label="Última decisión"
              icon={UserCheck}
              scoped={shown > 0}
              value={stats.latestReview ? (relativeTime(stats.latestReview.at, cutoff) ?? formatDateTime(stats.latestReview.at)) : "—"}
              hint={stats.latestReview ? (stats.latestReview.by ? `Por ${stats.latestReview.by}` : "Sin revisor registrado") : "Sin decisiones en esta página"}
            />
          )}
        </dl>

        <RequestsBoard requests={data.items} actorRoles={user.roles} cutoff={cutoff} dates={dates} emptyMessage={EMPTY_MESSAGES[status]} />

        {data.total > data.pageSize && (
          <Pagination
            page={page}
            lastPage={lastPage}
            total={data.total}
            shown={shown}
            noun={["solicitud", "solicitudes"]}
            hrefFor={(target) => href(status, target)}
          />
        )}
      </div>
    </div>
  );
}
