import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import { SprintsList } from "@/features/sprints/components/sprints-list";
import type { SprintList } from "@/features/sprints/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sprints del proyecto",
  robots: { index: false },
};

export default async function ProjectSprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/sprints`;
  await requireSessionUser(currentPath);
  const [project, sprints] = await loadProjectData<[ProjectDetail, SprintList]>([projectPath, `${projectPath}/sprints`], currentPath);

  // F2-20: los proyectos tradicionales no tienen sprints.
  if (project.methodology !== "agile") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProjectHeader project={project} eyebrow="Sprints" current="sprints" />
      <p className="mt-4 text-sm text-hub-muted">
        Un sprint agrupa tareas del backlog durante unas semanas. Solo puede haber uno activo; al cerrarlo, lo que no se
        terminó vuelve al backlog.
      </p>
      <div className="mt-6">
        <SprintsList projectId={project.id} sprints={sprints.items} canCreate={sprints.permissions.canCreateSprints} />
      </div>
    </div>
  );
}
