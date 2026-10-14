import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  METHODOLOGY_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectDetail,
} from "@/features/projects/types";
import { TaskBoard } from "@/features/tasks/components/task-board";
import type { TaskList } from "@/features/tasks/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Tareas del proyecto",
  robots: { index: false },
};

/** Maximo que acepta el backend por pagina; el tablero carga todas las tareas de una vez. */
const BOARD_PAGE_SIZE = 200;

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPath = `/hub/proyectos/${encodeURIComponent(id)}/tareas`;
  const user = await requireSessionUser(currentPath);
  let project: ProjectDetail;
  let tasks: TaskList;

  try {
    [project, tasks] = await Promise.all([
      serverApi<ProjectDetail>(`/projects/${encodeURIComponent(id)}`, currentPath),
      serverApi<TaskList>(`/projects/${encodeURIComponent(id)}/tasks?pageSize=${BOARD_PAGE_SIZE}`, currentPath),
    ]);
  } catch (caught) {
    // 404: proyecto inexistente o ajeno (el backend no distingue); 400: ID mal formado.
    if (caught instanceof ApiRequestError && (caught.status === 404 || caught.status === 400)) {
      notFound();
    }
    throw caught;
  }

  const assignees = project.members
    .filter((member) => member.accountStatus === "active")
    .map((member) => ({ userId: member.userId, fullName: member.fullName }));
  const finished = project.status === "completed" || project.status === "cancelled";

  return (
    // El tablero necesita mas ancho que las demas vistas (cuatro columnas).
    <div className="mx-auto w-full max-w-6xl">
      <Link
        href="/hub/proyectos"
        className="inline-flex items-center gap-1.5 text-sm text-hub-accent underline-offset-4 hover:underline"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Proyectos
      </Link>
      <p className="mt-4 text-sm font-medium text-hub-accent">
        {project.methodology === "agile" ? "Backlog del proyecto" : "Tareas del proyecto"}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text sm:text-3xl">{project.name}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge>
        <Badge>{METHODOLOGY_LABELS[project.methodology]}</Badge>
        {project.myRole && <Badge>Tu rol: {PROJECT_ROLE_LABELS[project.myRole]}</Badge>}
      </div>
      <p className="mt-3 text-sm text-hub-muted">
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
        />
      </div>
    </div>
  );
}
