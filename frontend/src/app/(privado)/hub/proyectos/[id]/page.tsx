import type { Metadata } from "next";

import { ProjectOverview } from "@/features/projects/components/project-overview";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import type { ObservationList, ProjectPanel } from "@/features/tracking/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Proyecto", robots: { index: false } };

/**
 * I-27: resumen del proyecto. Mismo acceso que el proyecto: sin permiso o con ID inexistente o mal
 * formado responde 404 sin revelar si existe.
 */
export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const slug = encodeURIComponent(id);
  const currentPath = `/hub/proyectos/${slug}`;
  await requireSessionUser(currentPath);
  const [project, panel, observations] = await loadProjectData<[ProjectDetail, ProjectPanel, ObservationList]>(
    [`/projects/${slug}`, `/tracking/projects/${slug}`, `/projects/${slug}/observations?pageSize=3`],
    currentPath,
  );

  return (
    <div className="mx-auto w-full max-w-430">
      <ProjectOverview project={project} panel={panel} observations={observations} />
    </div>
  );
}
