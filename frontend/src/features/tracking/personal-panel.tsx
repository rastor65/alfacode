import Link from "next/link";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { Badge } from "@/components/ui/badge";
import { formatCalendarDate, PROJECT_ROLE_LABELS, PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { TASK_STATUS_LABELS } from "@/features/tasks/types";
import { formatDateTime } from "@/lib/format";

import { Breakdown, Cutoff, Stat, StatGrid } from "./components/panel-ui";
import { plural, type PersonalPanel } from "./types";

const listClass = "mt-3 divide-y divide-hub-border rounded-2xl border border-hub-border";
const emptyClass = "mt-3 rounded-2xl border border-dashed border-hub-border px-4 py-6 text-center text-sm text-hub-muted";

/** F6-04: solo datos propios, ya filtrados por la visibilidad de cada modulo en el backend. */
export function PersonalPanelView({ data }: { data: PersonalPanel }) {
  return (
    <div className="space-y-8">
      <Cutoff value={data.cutoff} />
      <StatGrid label="Tus indicadores">
        <Stat label="Mis proyectos" value={data.projects.total} hint={data.projects.leading ? `Lideras ${data.projects.leading}` : undefined} href="/hub/proyectos" />
        <Stat label="Tareas abiertas" value={data.tasks.open} hint={data.tasks.overdue ? plural(data.tasks.overdue, "vencida", "vencidas") : "Ninguna vencida"} />
        <Stat label="Tareas terminadas" value={data.tasks.done} />
        <Stat label="Asistencias registradas" value={data.events.attended} href="/hub/actividades" />
        <Stat label="Productos académicos" value={data.products.total} href="/hub/produccion" />
      </StatGrid>

      <section aria-labelledby="my-tasks">
        <h2 id="my-tasks" className="text-base font-semibold">Mis tareas abiertas</h2>
        {data.tasks.items.length ? (
          <ul className={listClass}>
            {data.tasks.items.map((task) => {
              const overdue = task.dueDate !== null && task.dueDate < data.today;
              return (
                <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/hub/proyectos/${task.projectId}/tareas`} className="break-words font-medium text-hub-accent underline-offset-4 hover:underline">{task.title}</Link>
                    <p className="text-xs text-hub-muted">{task.projectName}{task.dueDate ? ` · Fecha límite: ${formatCalendarDate(task.dueDate)}` : " · Sin fecha límite"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">{overdue && <Badge>Vencida</Badge>}<Badge>{TASK_STATUS_LABELS[task.status]}</Badge></div>
                </li>
              );
            })}
          </ul>
        ) : <p className={emptyClass}>No tienes tareas abiertas.</p>}
        {data.tasks.open > data.tasks.items.length && <p className="mt-2 text-xs text-hub-muted">Se muestran {data.tasks.items.length} de {data.tasks.open}, por fecha límite.</p>}
      </section>

      <section aria-labelledby="my-events">
        <h2 id="my-events" className="text-base font-semibold">Próximas actividades</h2>
        {data.events.upcoming.length ? (
          <ul className={listClass}>
            {data.events.upcoming.map((event) => (
              <li key={event.id} className="p-3">
                <Link href={event.projectId ? `/hub/proyectos/${event.projectId}/actividades` : "/hub/actividades"} className="break-words font-medium text-hub-accent underline-offset-4 hover:underline">{event.title}</Link>
                <p className="text-xs text-hub-muted"><time dateTime={event.startsAt}>{formatDateTime(event.startsAt)}</time></p>
              </li>
            ))}
          </ul>
        ) : <p className={emptyClass}>No tienes inscripciones en actividades programadas.</p>}
      </section>

      <section aria-labelledby="my-projects">
        <h2 id="my-projects" className="text-base font-semibold">Mis proyectos</h2>
        {data.projects.items.length ? (
          <ul className={listClass}>
            {data.projects.items.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <Link href={`/hub/proyectos/${project.id}/seguimiento`} className="min-w-0 break-words font-medium text-hub-accent underline-offset-4 hover:underline">{project.name}</Link>
                <div className="flex flex-wrap gap-2"><Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge><Badge>{PROJECT_ROLE_LABELS[project.role]}</Badge></div>
              </li>
            ))}
          </ul>
        ) : <p className={emptyClass}>Aún no perteneces a ningún proyecto.</p>}
        {data.projects.total > data.projects.items.length && <p className="mt-2 text-xs text-hub-muted">Se muestran {data.projects.items.length} de {data.projects.total}. <Link href="/hub/proyectos" className="text-hub-accent underline">Ver todos</Link></p>}
      </section>

      {data.products.total > 0 && <Breakdown title="Mis productos por estado" labels={PRODUCT_STATUSES} counts={data.products.byStatus} />}
    </div>
  );
}
