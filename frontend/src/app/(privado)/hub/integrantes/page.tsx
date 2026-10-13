import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClassName } from "@/components/ui/field-styles";
import { InviteButton, MembersList } from "@/features/members/components/members-list";
import { ALL_ROLES, RoleSelect } from "@/features/members/components/role-select";
import {
  ACCOUNT_STATUS_LABELS,
  type AccountStatus,
  type MemberListItem,
  parseAccountStatus,
  parseRole,
  parseSearch,
} from "@/features/members/types";
import { type Paginated, parsePage } from "@/features/membership/types";
import { serverApi } from "@/lib/api/server";
import { ROLE_CODES, type RoleCode, isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Integrantes",
  robots: { index: false },
};

const PAGE_SIZE = 20;

type Filters = { q: string; role?: RoleCode; status: AccountStatus };

type MembersPageProps = {
  searchParams: Promise<{ q?: string | string[]; rol?: string | string[]; estado?: string | string[]; pagina?: string | string[] }>;
};

function href(filters: Filters, page = 1) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.role) params.set("rol", filters.role);
  if (filters.status !== "active") params.set("estado", filters.status);
  if (page > 1) params.set("pagina", String(page));

  const query = params.toString();
  return query ? `/hub/integrantes?${query}` : "/hub/integrantes";
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const user = await requireSessionUser("/hub/integrantes");
  const params = await searchParams;
  const authority = isAuthority(user.roles);
  // Solo las autoridades consultan cuentas que no estan activas (el backend lo exige).
  const filters: Filters = {
    q: parseSearch(params.q),
    role: parseRole(params.rol),
    status: authority ? parseAccountStatus(params.estado) : "active",
  };
  const page = parsePage(params.pagina);

  const query = new URLSearchParams({ status: filters.status, page: String(page), pageSize: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.role) query.set("role", filters.role);

  const data = await serverApi<Paginated<MemberListItem>>(`/users?${query}`, href(filters, page));
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Semillero</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">Integrantes</h1>
      </div>

      {authority && (
        <div className="mt-6">
          <InviteButton actorRoles={user.roles} />
        </div>
      )}

      {authority && (
        <nav aria-label="Estado de las cuentas" className="mt-6 flex flex-wrap gap-x-1 border-b border-hub-border">
          {(Object.keys(ACCOUNT_STATUS_LABELS) as AccountStatus[]).map((value) => (
            <Link
              key={value}
              href={href({ ...filters, status: value })}
              aria-current={value === filters.status ? "page" : undefined}
              className={cn(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                value === filters.status
                  ? "border-hub-accent font-medium text-hub-text"
                  : "border-transparent text-hub-muted hover:text-hub-text",
              )}
            >
              {ACCOUNT_STATUS_LABELS[value]}
            </Link>
          ))}
        </nav>
      )}

      {/* Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */}
      {/* Cuadricula de dos filas (etiquetas / controles): alinea los tres campos por construccion. */}
      <form
        action="/hub/integrantes"
        method="get"
        role="search"
        className="mt-5 grid grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_11rem_auto]"
      >
        {filters.status !== "active" && <input type="hidden" name="estado" value={filters.status} />}
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
            placeholder={authority ? "Nombre o correo" : "Nombre"}
            className={cn(selectClassName, "h-11 py-0 pl-9")}
          />
        </div>
        <label htmlFor="rol" className="mt-2 text-sm font-medium text-hub-soft sm:col-start-2 sm:row-start-1 sm:mt-0">
          Rol
        </label>
        {/* Envoltura: Radix agrega un <select> oculto que no debe sumar espacio al diseno. */}
        <div className="relative sm:col-start-2 sm:row-start-2">
          <RoleSelect id="rol" name="rol" roles={ROLE_CODES} includeAll defaultValue={filters.role ?? ALL_ROLES} />
        </div>
        <button
          type="submit"
          className="mt-2 h-11 rounded-xl border border-hub-input-border bg-hub-panel px-4 text-sm font-semibold text-hub-text transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:col-start-3 sm:row-start-2 sm:mt-0"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-5 text-sm text-hub-muted" aria-live="polite">
        {data.total === 1 ? "1 integrante" : `${data.total} integrantes`}
      </p>

      {data.items.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          No hay integrantes con esos filtros.
        </p>
      ) : (
        <MembersList members={data.items} actor={{ id: user.id, roles: user.roles }} authority={authority} />
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
