import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { OptionSelect } from "@/components/ui/option-select";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import { parsePage } from "@/features/membership/types";
import { parseSearch } from "@/features/members/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";
import { AcademicCatalog } from "./components/academic-catalog";
import { knownOption, PRODUCT_STATUSES, PRODUCT_TYPES, type AcademicKind, type AcademicPage } from "./types";

export type AcademicSearch = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
export async function AcademicPageContent({ projectId, searchParams }: { projectId?: string; searchParams: Promise<AcademicSearch> }) {
  const path = projectId ? `/hub/proyectos/${projectId}/produccion` : "/hub/produccion";
  const user = await requireSessionUser(path);
  const params = await searchParams;
  const kind: AcademicKind = first(params.vista) === "recognitions" ? "recognitions" : "academic-products";
  const query = new URLSearchParams({ page: String(parsePage(params.pagina)), pageSize: "20" });
  const authorId = first(params.integrante);
  if (authorId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authorId)) query.set("authorId", authorId);
  const q = parseSearch(params.q);
  if (q) query.set("q", q);
  if (projectId) query.set("projectId", projectId);
  const type = knownOption(PRODUCT_TYPES, params.tipo), status = knownOption(PRODUCT_STATUSES, params.estado);
  if (type) query.set("type", type);
  if (status) query.set("status", status);
  const [data, project] = projectId
    ? await loadProjectData<[AcademicPage, ProjectDetail]>([`/${kind}?${query}`, `/projects/${encodeURIComponent(projectId)}`], path)
    : [await serverApi<AcademicPage>(`/${kind}?${query}`, path), null];
  const link = (changes: Record<string, string>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) { const single = first(value); if (single) next.set(key, single); }
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    return `${path}?${next}`;
  };
  return <div className="mx-auto w-full max-w-3xl">
    {project ? <ProjectHeader project={project} current="produccion" eyebrow="Producción académica" /> : <><p className="text-sm font-medium text-hub-accent">Historial académico</p><h1 className="mt-1 text-2xl font-bold text-hub-text">Producción y reconocimientos</h1><p className="mt-2 text-sm text-hub-muted">Consulta productos institucionales y de tus proyectos. Los líderes registran aportes desde la pestaña de cada proyecto.</p></>}
    <nav aria-label="Tipo de registro académico" className="mt-6 flex flex-wrap gap-3 border-b border-hub-border pb-3">
      <Link href={link({ vista: "academic-products", pagina: "" })} aria-current={kind === "academic-products" ? "page" : undefined} className="text-sm text-hub-accent underline">Productos académicos</Link>
      <Link href={link({ vista: "recognitions", pagina: "" })} aria-current={kind === "recognitions" ? "page" : undefined} className="text-sm text-hub-accent underline">Reconocimientos</Link>
      <Link href={link({ integrante: authorId ? "" : user.id, pagina: "" })} className="text-sm text-hub-accent underline">{authorId ? "Quitar filtro de integrante" : "Mi participación"}</Link>
    </nav>
    <form action={path} method="get" role="search" className="my-5 space-y-3">
      <input type="hidden" name="vista" value={kind} />
      {query.has("authorId") && <input type="hidden" name="integrante" value={authorId} />}
      <FormField label="Buscar por título" name="q" type="search" maxLength={100} defaultValue={q} />
      {kind === "academic-products" && <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="academic-type" className="mb-1 block text-sm">Tipo</label><OptionSelect id="academic-type" name="tipo" defaultValue={type ?? "all"} options={[{ value: "all", label: "Todos" }, ...Object.entries(PRODUCT_TYPES).map(([value, label]) => ({ value, label }))]} /></div><div><label htmlFor="academic-status" className="mb-1 block text-sm">Estado</label><OptionSelect id="academic-status" name="estado" defaultValue={status ?? "all"} options={[{ value: "all", label: "Todos" }, ...Object.entries(PRODUCT_STATUSES).map(([value, label]) => ({ value, label }))]} /></div></div>}
      <Button type="submit" variant="neutral">Filtrar</Button>
    </form>
    <AcademicCatalog key={kind} kind={kind} items={data.items} projectId={projectId} canCreate={project ? project.permissions.canEdit : data.permissions.canCreateInstitutional} canCreateInstitutional={data.permissions.canCreateInstitutional} />
    <nav aria-label="Paginación" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-hub-muted">
      <span>{data.total} registros autorizados · Página {data.page} de {Math.max(1, Math.ceil(data.total / data.pageSize))}</span>
      <div className="flex gap-4">{data.page > 1 && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page - 1) })}>Anterior</Link>}{data.page * data.pageSize < data.total && <Link className="text-hub-accent underline" href={link({ pagina: String(data.page + 1) })}>Siguiente</Link>}</div>
    </nav>
  </div>;
}
