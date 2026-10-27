import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ProjectPageHeader } from "@/features/projects/components/project-page-header";
import { loadProjectData, loadTabCounts } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import type { SprintList } from "@/features/sprints/types";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { TASKS_VIEW_COOKIE, type TaskList, parseTasksView } from "@/features/tasks/types";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Tareas del proyecto",
  robots: { index: false },
};

/** Maximo que acepta el backend por pagina; el tablero carga todas las tareas de una vez. */
const BOARD_PAGE_SIZE = 200;

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = `/projects/${encodeURIComponent(id)}`;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/tareas`;
  const user = await requireSessionUser(currentPath);
  // En proyectos tradicionales la lista de sprints llega vacia y no se usa.
  const [[project, tasks, sprints], cookieStore, counts] = await Promise.all([
    loadProjectData<[ProjectDetail, TaskList, SprintList]>([projectPath, `${projectPath}/tasks?pageSize=${BOARD_PAGE_SIZE}`, `${projectPath}/sprints`], currentPath),
    cookies(),
    loadTabCounts(id, currentPath),
  ]);

  const agile = project.methodology === "agile";
  const assignees = project.members
    .filter((member) => member.accountStatus === "active")
    .map((member) => ({ userId: member.userId, fullName: member.fullName }));
  const finished = project.status === "completed" || project.status === "cancelled";

  return (
    <div className="mx-auto w-full max-w-430">
      <div className="flex flex-col gap-6">
        <ProjectPageHeader
          project={project}
          current="tareas"
          crumb={agile ? "Backlog y tablero" : "Tareas"}
          meta={
            <span className="text-hub-muted">
              {finished
                ? "El proyecto está finalizado: las tareas se pueden consultar, pero no cambiar."
                : tasks.permissions.canManageTasks
                  ? "Crea y asigna tareas; mueve cada tarjeta entre columnas con su selector de estado o arrastrándola."
                  : "Puedes mover entre columnas las tareas que tienes asignadas."}
            </span>
          }
          counts={counts}
        />
        <TaskBoard
          projectId={project.id}
          initialTasks={tasks.items}
          totalTasks={tasks.total}
          assignees={assignees}
          currentUserId={user.id}
          canManageTasks={tasks.permissions.canManageTasks}
          sprints={agile ? sprints.items : undefined}
          initialView={parseTasksView(cookieStore.get(TASKS_VIEW_COOKIE)?.value)}
        />
      </div>
    </div>
  );
}
