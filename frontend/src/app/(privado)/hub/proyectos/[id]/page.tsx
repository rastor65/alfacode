import type { Metadata } from "next";
import { cookies } from "next/headers";

import type { AcademicPage } from "@/features/academic/types";
import type { DocumentList } from "@/features/documents/types";
import type { EventPage } from "@/features/events/types";
import { ProjectDedicatedView } from "@/features/projects/components/project-dedicated-view";
import type { ProjectSection } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail, ProjectSummary } from "@/features/projects/types";
import type { ProjectLines, ProjectProfile, ResultList } from "@/features/research/types";
import type { SprintList } from "@/features/sprints/types";
import { parseTasksView, TASKS_VIEW_COOKIE, type TaskList } from "@/features/tasks/types";
import type { ObservationList, ProjectPanel } from "@/features/tracking/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Proyecto", robots: { index: false } };

/**
 * Vista dedicada integral de un proyecto: reúne todas las pestañas (Resumen, Tareas, Sprints,
 * Investigación, Documentos, Producción, Actividades, Seguimiento) en la misma vista interactiva.
 */
export default async function ProjectDedicatedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const slug = encodeURIComponent(id);
  const projectPath = `/projects/${slug}`;
  const currentPath = `/hub/proyectos/${slug}`;

  const [user, cookieStore] = await Promise.all([requireSessionUser(currentPath), cookies()]);

  // Carga paralela de los datos requeridos por las pestañas del proyecto
  const [
    project,
    panel,
    observations,
    tasks,
    sprints,
    researchLines,
    researchProfile,
    researchResults,
    documents,
    academicProducts,
    recognitions,
    events,
  ] = await loadProjectData<
    [
      ProjectDetail,
      ProjectPanel,
      ObservationList,
      TaskList,
      SprintList,
      ProjectLines,
      ProjectProfile,
      ResultList,
      DocumentList,
      AcademicPage,
      AcademicPage,
      EventPage,
    ]
  >(
    [
      projectPath,
      `/tracking/projects/${slug}`,
      `${projectPath}/observations?pageSize=50`,
      `${projectPath}/tasks?pageSize=200`,
      `${projectPath}/sprints`,
      `${projectPath}/research-lines`,
      `${projectPath}/research-profile`,
      `${projectPath}/research-results`,
      `${projectPath}/documents?pageSize=100`,
      `/academic-products?projectId=${slug}&pageSize=50`,
      `/recognitions?projectId=${slug}&pageSize=50`,
      `/events?projectId=${slug}&page=1&pageSize=100`,
    ],
    currentPath,
  );

  return (
    <ProjectDedicatedView
      project={project}
      panel={panel}
      observations={observations}
      tasks={tasks}
      sprints={sprints}
      researchLines={researchLines}
      researchProfile={researchProfile}
      researchResults={researchResults}
      documents={documents}
      academicProducts={academicProducts}
      recognitions={recognitions}
      events={events}
      currentUserId={user.id}
      initialTasksView={parseTasksView(cookieStore.get(TASKS_VIEW_COOKIE)?.value)}
      initialTab={tab as ProjectSection | undefined}
    />
  );
}
