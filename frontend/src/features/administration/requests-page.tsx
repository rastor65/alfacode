import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { parsePage } from "@/features/membership/types";
import { parseSearch } from "@/features/members/types";
import { requireSessionUser } from "@/lib/auth/session";
import { isAuthority } from "@/lib/auth/roles";
import { serverApi } from "@/lib/api/server";
import { RequestsCatalog } from "./components/requests-catalog";
import { knownKey, REQUEST_STATUSES, REQUEST_TYPES, type RequestList } from "./types";
export type RequestSearch = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;

export async function RequestsPage({ searchParams }: { searchParams: Promise<RequestSearch> }) {
  const path = "/hub/tramites", user = await requireSessionUser(path), p = await searchParams;
  const authority = isAuthority(user.roles), view = authority && first(p.vista) === "review" ? "review" : "mine";
  const type = knownKey(REQUEST_TYPES, p.tipo), status = knownKey(REQUEST_STATUSES, p.estado), q = parseSearch(p.q);
  const query = new URLSearchParams({ view, page: String(parsePage(p.pagina)), pageSize: "20" });
  if (type) query.set("type", type); if (status) query.set("status", status); if (q) query.set("q", q);
  if (authority && first(p.responsable) === "me") query.set("reviewerId", user.id);
  const data = await serverApi<RequestList>(`/administrative-requests?${query}`, path);
  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams(); for (const [key, value] of Object.entries(p)) { const v = first(value); if (v) next.set(key, v); }
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); } return `${path}?${next}`;
  };
  return <div className="mx-auto w-full max-w-3xl">
    <p className="text-sm font-medium text-hub-accent">Gestión administrativa</p><h1 className="mt-1 text-2xl font-bold">Trámites y solicitudes</h1><p className="mt-2 text-sm text-hub-muted">Consulta tus peticiones, respuestas y soportes. Las solicitudes de ingreso se gestionan en Vinculaciones.</p>
    <nav aria-label="Bandeja de trámites" className="mt-6 flex flex-wrap gap-4 border-b border-hub-border pb-3"><Link className="min-h-11 content-center text-sm text-hub-accent underline" href={link({ vista: "mine", pagina: "" })} aria-current={view === "mine" ? "page" : undefined}>Mis solicitudes</Link>{authority && <Link className="min-h-11 content-center text-sm text-hub-accent underline" href={link({ vista: "review", pagina: "" })} aria-current={view === "review" ? "page" : undefined}>Bandeja de revisión</Link>}</nav>
    <form action={path} method="get" role="search" className="my-5 space-y-3"><input type="hidden" name="vista" value={view} /><FormField label="Buscar por asunto" name="q" type="search" defaultValue={q} maxLength={100} />
      <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="filter-request-type" className="mb-1 block text-sm">Tipo</label><OptionSelect id="filter-request-type" name="tipo" defaultValue={type ?? "all"} options={[{ value: "all", label: "Todos" }, ...Object.entries(REQUEST_TYPES).map(([value, label]) => ({ value, label }))]} /></div><div><label htmlFor="filter-request-status" className="mb-1 block text-sm">Estado</label><OptionSelect id="filter-request-status" name="estado" defaultValue={status ?? "all"} options={[{ value: "all", label: "Todos" }, ...Object.entries(REQUEST_STATUSES).map(([value, label]) => ({ value, label }))]} /></div></div>
      {authority && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="responsable" value="me" defaultChecked={query.has("reviewerId")} />Asignadas a mí</label>}
      <Button type="submit" variant="neutral">Filtrar</Button>
    </form>
    <RequestsCatalog items={data.items} />
    <nav aria-label="Paginación de solicitudes" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted"><span>{data.total} solicitudes · Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><div className="flex gap-4">{data.page > 1 && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page - 1) })}>Anterior</Link>}{data.page * data.pageSize < data.total && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page + 1) })}>Siguiente</Link>}</div></nav>
  </div>;
}
