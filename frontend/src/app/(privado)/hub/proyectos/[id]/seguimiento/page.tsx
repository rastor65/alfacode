import type { Metadata } from "next";
import { Suspense } from "react";

import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import { PanelLoading } from "@/features/tracking/components/panel-states";
import { ProjectTracking } from "@/features/tracking/components/project-tracking";
import { RefreshButton } from "@/features/tracking/components/refresh-button";
import type { ObservationList, ProjectPanel } from "@/features/tracking/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Seguimiento del proyecto", robots: { index: false } };

/**
 * F6-03: avance operativo del proyecto; mismo acceso que el proyecto. El proyecto se lee antes del
 * limite de Suspense para conservar el 404 sin acceso (el streaming fija el estado HTTP en 200).
 */
export default async function ProjectTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/seguimiento`;
  await requireSessionUser(currentPath);
  const [[project], counts] = await Promise.all([loadProjectData<[ProjectDetail]>([`/projects/${encodeURIComponent(id)}`], currentPath), loadTabCounts(id, currentPath)]);

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <ProjectPageHeader project={project} current="seguimiento" crumb="Seguimiento" actions={<RefreshButton />} counts={counts} />
        <Suspense fallback={<PanelLoading label="Calculando el seguimiento del proyecto…" />}>
          <ProjectTrackingContent project={project} currentPath={currentPath} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProjectTrackingContent({ project, currentPath }: { project: ProjectDetail; currentPath: string }) {
  const id = encodeURIComponent(project.id);
  const [panel, observations] = await loadProjectData<[ProjectPanel, ObservationList]>([`/tracking/projects/${id}`, `/projects/${id}/observations?pageSize=10`], currentPath);

  return <ProjectTracking project={project} panel={panel} observations={observations} />;
}
