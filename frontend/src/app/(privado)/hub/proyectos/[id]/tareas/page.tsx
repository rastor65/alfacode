import type { Metadata } from "next";

import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import type { ProjectDetail } from "@/features/projects/types";
import type { SprintList } from "@/features/sprints/types";
import { TaskBoard } from "@/features/tasks/components/task-board";
import type { TaskList } from "@/features/tasks/types";
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
  const [project, tasks, sprints] = await loadProjectData<[ProjectDetail, TaskList, SprintList]>(
    [projectPath, `${projectPath}/tasks?pageSize=${BOARD_PAGE_SIZE}`, `${projectPath}/sprints`],
    currentPath,
  );

  const agile = project.methodology === "agile";
  const assignees = project.members
    .filter((member) => member.accountStatus === "active")
    .map((member) => ({ userId: member.userId, fullName: member.fullName }));
  const finished = project.status === "completed" || project.status === "cancelled";

  return (
    // El tablero necesita mas ancho que las demas vistas (cuatro columnas).
    <div className="mx-auto w-full max-w-6xl">
      <ProjectHeader project={project} eyebrow={agile ? "Backlog y tablero" : "Tareas del proyecto"} current="tareas" />
      <p className="mt-4 text-sm text-hub-muted">
        {finished
          ? "El proyecto está finalizado: las tareas se pueden consultar, pero no cambiar."
          : tasks.permissions.canManageTasks
            ? "Crea y asigna tareas; mueve cada tarjeta entre columnas con su selector de estado o arrastrándola."
            : "Puedes mover entre columnas las tareas que tienes asignadas."}
      </p>

      <div className="mt-6">
        <TaskBoard
          projectId={project.id}
          initialTasks={tasks.items}
          totalTasks={tasks.total}
          assignees={assignees}
          currentUserId={user.id}
          canManageTasks={tasks.permissions.canManageTasks}
          sprints={agile ? sprints.items : undefined}
        />
      </div>
    </div>
  );
}
