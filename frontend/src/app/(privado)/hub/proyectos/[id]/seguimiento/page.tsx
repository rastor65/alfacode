import type { Metadata } from "next";
import { Suspense } from "react";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { EVENT_STATUSES } from "@/features/events/types";
import { ProjectHeader } from "@/features/projects/components/project-header";
import { loadProjectData } from "@/features/projects/load-project";
import { formatCalendarDate, type ProjectDetail } from "@/features/projects/types";
import { TASK_STATUS_LABELS } from "@/features/tasks/types";
import { Observations } from "@/features/tracking/components/observations";
import { PanelLoading } from "@/features/tracking/components/panel-states";
import { Breakdown, Cutoff, Stat, StatGrid, TaskProgress } from "@/features/tracking/components/panel-ui";
import { plural, type ObservationList, type ProjectPanel } from "@/features/tracking/types";
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
  const [project] = await loadProjectData<[ProjectDetail]>([`/projects/${encodeURIComponent(id)}`], currentPath);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <ProjectHeader project={project} eyebrow="Seguimiento" current="seguimiento" />
      <Suspense fallback={<div className="mt-6"><PanelLoading label="Calculando el seguimiento del proyecto…" /></div>}>
        <ProjectTrackingContent project={project} currentPath={currentPath} />
      </Suspense>
    </div>
  );
}

async function ProjectTrackingContent({ project, currentPath }: { project: ProjectDetail; currentPath: string }) {
  const id = encodeURIComponent(project.id);
  const [data, observations] = await loadProjectData<[ProjectPanel, ObservationList]>([`/tracking/projects/${id}`, `/projects/${id}/observations?pageSize=10`], currentPath);
  const dates = [data.project.startDate && `Inicio: ${formatCalendarDate(data.project.startDate)}`, data.project.endDate && `Fin planificado: ${formatCalendarDate(data.project.endDate)}`].filter(Boolean).join(" · ");

  return (
    <>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-hub-muted">El avance cuenta tareas terminadas sobre el total: es una referencia de actividad, no mide la calidad ni el logro de los objetivos.</p>
        {dates && <p className="text-sm">{dates}</p>}
        <Cutoff value={data.cutoff} />
      </div>

      <section className="mt-6 space-y-4 rounded-2xl border border-hub-border p-4">
        <TaskProgress title="Avance de tareas" summary={data.tasks} />
        {data.sprints?.active && <TaskProgress title={`Sprint activo: ${data.sprints.active.name} (${formatCalendarDate(data.sprints.active.startDate)} – ${formatCalendarDate(data.sprints.active.endDate)})`} summary={data.sprints.active.tasks} />}
        {data.sprints && !data.sprints.active && <p className="text-sm text-hub-muted">No hay un sprint activo.</p>}
        {data.sprints?.lastCompleted && <TaskProgress title={`Último sprint cerrado: ${data.sprints.lastCompleted.name} (registro al cierre)`} summary={data.sprints.lastCompleted.tasks} />}
      </section>

      <div className="mt-6">
        <StatGrid label="Indicadores del proyecto">
          <Stat label="Tareas pendientes" value={data.tasks.pending} hint={plural(data.tasks.done, "terminada", "terminadas")} href={`/hub/proyectos/${project.id}/tareas`} />
          <Stat label="Tareas vencidas" value={data.tasks.overdue} hint="Fecha límite anterior a hoy, sin terminar" />
          <Stat label="Vencen en 7 días" value={data.tasks.dueSoon} />
          <Stat label="Sin responsable" value={data.tasks.unassigned} hint="Tareas abiertas sin asignar" />
          <Stat label="Resultados investigativos" value={data.deliverables.researchResults} href={`/hub/proyectos/${project.id}/investigacion`} />
          <Stat label="Productos académicos" value={data.deliverables.products.total} href={`/hub/proyectos/${project.id}/produccion`} />
          <Stat label="Equipo" value={data.team.members} hint={data.team.leaders === 1 ? "1 líder" : `${data.team.leaders} líderes`} />
          <Stat label="Actividades" value={data.events.total} hint={plural(data.events.byStatus.completed, "realizada", "realizadas")} href={`/hub/proyectos/${project.id}/actividades`} />
        </StatGrid>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Breakdown title="Tareas por estado" labels={TASK_STATUS_LABELS} counts={data.tasks.byStatus} />
        <Breakdown title="Productos por estado" labels={PRODUCT_STATUSES} counts={data.deliverables.products.byStatus} />
        <Breakdown title="Actividades por estado" labels={EVENT_STATUSES} counts={data.events.byStatus} />
      </div>

      <div className="mt-8">
        <Observations projectId={project.id} initial={observations} />
      </div>
    </>
  );
}
