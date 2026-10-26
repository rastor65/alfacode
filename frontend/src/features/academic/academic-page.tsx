import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
import type { ProjectDetail, ProjectTabCounts } from "@/features/projects/types";
import { parsePage } from "@/features/membership/types";
import { parseSearch } from "@/features/members/types";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";

import { AcademicKpis, AcademicPagination, AcademicToolbar } from "./academic-sections";
import { AcademicCatalog } from "./components/academic-catalog";
import { knownOption, PRODUCT_STATUSES, PRODUCT_TYPES, productStats, STATS_SAMPLE, type AcademicKind, type AcademicPage } from "./types";

export type AcademicSearch = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Produccion academica y reconocimientos: del proyecto (con `projectId`) o del catalogo institucional. */
export async function AcademicPageContent({ projectId, searchParams }: { projectId?: string; searchParams: Promise<AcademicSearch> }) {
  const path = projectId ? `/hub/proyectos/${projectId}/produccion` : "/hub/produccion";
  const user = await requireSessionUser(path);
  const params = await searchParams;
  const kind: AcademicKind = first(params.vista) === "recognitions" ? "recognitions" : "academic-products";
  const query = new URLSearchParams({ page: String(parsePage(params.pagina)), pageSize: "20" });
  const authorId = first(params.integrante);
  if (authorId && UUID.test(authorId)) query.set("authorId", authorId);
  const q = parseSearch(params.q);
  if (q) query.set("q", q);
  if (projectId) query.set("projectId", projectId);
  const type = knownOption(PRODUCT_TYPES, params.tipo);
  const status = knownOption(PRODUCT_STATUSES, params.estado);
  if (type) query.set("type", type);
  if (status) query.set("status", status);

  // Los indicadores y las pestañas cuentan todo lo autorizado, sin los filtros de la lista.
  const scope = projectId ? `projectId=${encodeURIComponent(projectId)}&` : "";
  const requests: [string, string, string] = [`/${kind}?${query}`, `/academic-products?${scope}pageSize=${STATS_SAMPLE}`, `/recognitions?${scope}pageSize=1`];
  let data: AcademicPage, products: AcademicPage, recognitions: AcademicPage, project: ProjectDetail | null;
  let tabCounts: ProjectTabCounts = {};

  if (projectId) {
    let loaded: [AcademicPage, AcademicPage, AcademicPage, ProjectDetail];
    [loaded, tabCounts] = await Promise.all([
      loadProjectData<[AcademicPage, AcademicPage, AcademicPage, ProjectDetail]>([...requests, `/projects/${encodeURIComponent(projectId)}`], path),
      loadTabCounts(projectId, path),
    ]);
    [data, products, recognitions, project] = loaded;
  } else {
    [data, products, recognitions] = await Promise.all(requests.map((request) => serverApi<AcademicPage>(request, path)));
    project = null;
  }

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
    const queryString = next.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  return (
    <div className="mx-auto w-full max-w-430">
      <AcademicCatalog
        key={kind}
        kind={kind}
        items={data.items}
        projectId={projectId}
        project={project && { id: project.id, name: project.name, status: project.status, methodology: project.methodology, type: project.type }}
        tabCounts={tabCounts}
        canCreate={project ? project.permissions.canEdit : data.permissions.canCreateInstitutional}
        canCreateInstitutional={data.permissions.canCreateInstitutional}
        before={
          <>
            <AcademicKpis productsTotal={products.total} recognitionsTotal={recognitions.total} stats={productStats(products.items)} />
            <AcademicToolbar
              path={path}
              kind={kind}
              productsTotal={products.total}
              recognitionsTotal={recognitions.total}
              q={q}
              type={type}
              status={status}
              mine={query.get("authorId") === user.id}
              authorId={query.get("authorId") ?? undefined}
              link={link}
              userId={user.id}
            />
          </>
        }
        after={<AcademicPagination total={data.total} page={data.page} pageSize={data.pageSize} shown={data.items.length} link={link} sampleNote={products.total > products.items.length} />}
      />
    </div>
  );
}
