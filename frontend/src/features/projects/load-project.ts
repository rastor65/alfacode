import "server-only";

import { notFound } from "next/navigation";

import type { EventItem } from "@/features/events/types";
import type { ProjectPanel } from "@/features/tracking/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { bogotaDay } from "@/lib/format";

import type { ProjectTabCounts } from "./types";

/**
 * Lecturas de las vistas de un proyecto: 404 (proyecto inexistente o ajeno, que el backend no
 * distingue) y 400 (ID mal formado) muestran la pagina de no encontrado.
 */
export async function loadProjectData<T extends unknown[]>(paths: { [K in keyof T]: string }, currentPath: string): Promise<T> {
  try {
    return (await Promise.all(paths.map((path) => serverApi(path, currentPath)))) as T;
  } catch (caught) {
    if (caught instanceof ApiRequestError && (caught.status === 404 || caught.status === 400)) {
      notFound();
    }
    throw caught;
  }
}

/**
 * Cifras de las pestañas del proyecto (tareas, sprint activo, investigacion, documentos, produccion,
 * actividades proximas y alertas). Cada lectura es independiente: si una falla, esa pestaña simplemente
 * no muestra cifra. El acceso lo verifica la propia vista con `loadProjectData`.
 */
export async function loadTabCounts(projectId: string, currentPath: string): Promise<ProjectTabCounts> {
  const id = encodeURIComponent(projectId);
  const today = bogotaDay(new Date().toISOString());
  const [panel, documents, events] = await Promise.allSettled([
    serverApi<ProjectPanel>(`/tracking/projects/${id}`, currentPath),
    serverApi<{ total: number }>(`/projects/${id}/documents?pageSize=1`, currentPath),
    serverApi<{ items: Pick<EventItem, "status">[] }>(`/events?projectId=${id}&from=${today}&pageSize=50`, currentPath),
  ]);
  const counts: ProjectTabCounts = {};

  if (panel.status === "fulfilled") {
    counts.tasks = panel.value.tasks.total;
    counts.activeSprint = panel.value.sprints?.active?.name;
    counts.research = panel.value.deliverables.researchResults;
    counts.production = panel.value.deliverables.products.total;
    counts.alerts = panel.value.signals.risks.length;
  }

  if (documents.status === "fulfilled") counts.documents = documents.value.total;
  if (events.status === "fulfilled") counts.upcoming = events.value.items.filter((event) => event.status === "scheduled").length;

  return counts;
}
