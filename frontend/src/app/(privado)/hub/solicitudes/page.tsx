import type { Metadata } from "next";
import Link from "next/link";

import { RequestsBoard } from "@/features/membership/components/requests-board";
import {
  type MembershipRequestItem,
  type MembershipRequestStatus,
  type Paginated,
  REQUEST_STATUS_LABELS,
  parsePage,
  parseRequestStatus,
} from "@/features/membership/types";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Solicitudes",
  robots: { index: false },
};

const PAGE_SIZE = 20;

const EMPTY_MESSAGES: Record<MembershipRequestStatus, string> = {
  pending: "No hay solicitudes pendientes.",
  approved: "Aún no se ha aprobado ninguna solicitud.",
  rejected: "No hay solicitudes rechazadas.",
};

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

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const user = await requireSessionUser("/hub/solicitudes");
  const params = await searchParams;
  const status = parseRequestStatus(params.estado);
  const page = parsePage(params.pagina);

  // Solo presentacion: el backend responde 403 a cualquier otra persona.
  if (!isAuthority(user.roles)) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-hub-text">Solicitudes</h1>
        <p className="mt-3 text-sm text-hub-muted">Solo la administración y la coordinación revisan las solicitudes de acceso.</p>
      </div>
    );
  }

  const data = await serverApi<Paginated<MembershipRequestItem>>(
    `/membership-requests?status=${status}&page=${page}&pageSize=${PAGE_SIZE}`,
    href(status, page),
  );
  const dates = Object.fromEntries(
    data.items.map((item) => [
      item.id,
      { created: formatDateTime(item.createdAt), reviewed: item.reviewedAt ? formatDateTime(item.reviewedAt) : null },
    ]),
  );
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Vinculación</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Solicitudes de acceso</h1>
      <p className="mt-2 text-sm text-hub-muted">
        Al aprobar una solicitud, la cuenta se activa con el rol elegido y la persona recibe una contraseña temporal en su
        correo institucional.
      </p>

      <nav aria-label="Estado de las solicitudes" className="mt-6 flex gap-1 border-b border-hub-border">
        {(Object.keys(REQUEST_STATUS_LABELS) as MembershipRequestStatus[]).map((value) => (
          <Link
            key={value}
            href={href(value)}
            aria-current={value === status ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
              value === status
                ? "border-hub-accent font-medium text-hub-text"
                : "border-transparent text-hub-muted hover:text-hub-text",
            )}
          >
            {REQUEST_STATUS_LABELS[value]}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <RequestsBoard requests={data.items} actorRoles={user.roles} dates={dates} emptyMessage={EMPTY_MESSAGES[status]} />
      </div>

      {data.total > data.pageSize && (
        <nav aria-label="Paginación" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href(status, page - 1)} className="text-hub-accent underline-offset-4 hover:underline">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-hub-muted">
            Página {page} de {lastPage} · {data.total} en total
          </span>
          {page < lastPage ? (
            <Link href={href(status, page + 1)} className="text-hub-accent underline-offset-4 hover:underline">
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
