import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import { NewSprintButton } from "@/features/sprints/components/new-sprint-button";
import { SprintsBoard } from "@/features/sprints/components/sprints-board";
import { activeSprint, type SprintDetail, type SprintList } from "@/features/sprints/types";
import type { TaskList } from "@/features/tasks/types";
import { requireSessionUser } from "@/lib/auth/session";
import { bogotaDay } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sprints del proyecto",
  robots: { index: false },
};

export default async function ProjectSprintsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/sprints`;
  await requireSessionUser(currentPath);
  const [[project, sprints, backlog], counts] = await Promise.all([
    loadProjectData<[ProjectDetail, SprintList, TaskList]>([projectPath, `${projectPath}/sprints`, `${projectPath}/tasks?sprintId=none&pageSize=1`], currentPath),
    loadTabCounts(id, currentPath),
  ]);

  // F2-20: los proyectos tradicionales no tienen sprints.
  if (project.methodology !== "agile") {
    notFound();
  }

  const active = activeSprint(sprints.items);
  const activeDetail = active ? (await loadProjectData<[SprintDetail]>([`${projectPath}/sprints/${active.id}`], currentPath))[0] : null;

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <ProjectPageHeader
          project={project}
          current="sprints"
          crumb="Sprints"
          actions={sprints.permissions.canCreateSprints ? <NewSprintButton projectId={project.id} /> : undefined}
          counts={counts}
        />
        <SprintsBoard projectId={project.id} sprints={sprints.items} activeDetail={activeDetail} backlogTotal={backlog.total} today={bogotaDay(new Date().toISOString())} />
      </div>
    </div>
  );
}
