import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PRODUCT_STATUSES } from "@/features/academic/types";
import { EVENT_STATUSES } from "@/features/events/types";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/features/projects/types";
import { TASK_STATUS_LABELS } from "@/features/tasks/types";
import { Breakdown, Cutoff, Stat, StatGrid, TaskProgress } from "@/features/tracking/components/panel-ui";
import { PanelLoading } from "@/features/tracking/components/panel-states";
import { plural, progressLabel, type InstitutionalPanel } from "@/features/tracking/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isAuthority } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Seguimiento institucional", robots: { index: false } };

async function load() {
  try {
    return await serverApi<InstitutionalPanel>("/tracking/institutional", "/hub/seguimiento");
  } catch (caught) {
    // El backend decide: sin permiso la pagina no existe para quien navega.
    if (caught instanceof ApiRequestError && caught.status === 403) notFound();
    throw caught;
  }
}

/**
 * F6-02: indicadores generales para coordinacion y administracion. El permiso se comprueba antes
 * del limite de Suspense para conservar el 404 (el streaming fija el estado HTTP en 200).
 */
export default async function InstitutionalPage() {
  const user = await requireSessionUser("/hub/seguimiento");
  if (!isAuthority(user.roles)) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-medium text-hub-accent">Seguimiento</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Panel institucional</h1>
        <p className="mt-2 text-sm text-hub-muted">Estado general del semillero a partir de los registros existentes. Los porcentajes de tareas son una referencia operativa, no una evaluación de calidad.</p>
        <p className="mt-3 text-sm"><Link href="/hub/reportes" className="font-medium text-hub-accent underline-offset-4 hover:underline">Consultar reportes filtrables</Link></p>
      </header>
      <Suspense fallback={<PanelLoading label="Calculando indicadores del semillero…" />}>
        <InstitutionalContent />
      </Suspense>
    </div>
  );
}

async function InstitutionalContent() {
  const data = await load();
  return (
    <div className="space-y-8">
      <Cutoff value={data.cutoff} />

      <StatGrid label="Indicadores generales">
        <Stat label="Integrantes activos" value={data.members.active} href="/hub/integrantes" />
        <Stat label="Proyectos activos" value={data.projects.byStatus.active} hint={`${plural(data.projects.byStatus.completed, "finalizado", "finalizados")} · ${data.projects.total} en total`} href="/hub/proyectos" />
        <Stat label="Actividades realizadas" value={data.events.completed} hint={plural(data.events.attendances, "asistencia registrada", "asistencias registradas")} href="/hub/actividades" />
        <Stat label="Productos registrados" value={data.products.total} hint={plural(data.products.published, "publicado o presentado", "publicados o presentados")} href="/hub/produccion" />
        <Stat label="Tareas terminadas" value={data.tasks.done} hint={plural(data.tasks.pending, "pendiente", "pendientes")} />
        <Stat label="Cumplimiento de tareas" value={progressLabel(data.tasks)} hint="Terminadas sobre el total registrado" />
      </StatGrid>

      <section className="rounded-2xl border border-hub-border p-4"><TaskProgress title="Tareas de todos los proyectos" summary={data.tasks} /></section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Breakdown title="Proyectos por estado" labels={PROJECT_STATUS_LABELS} counts={data.projects.byStatus} />
        <Breakdown title="Proyectos por tipo" labels={PROJECT_TYPE_LABELS} counts={data.projects.byType} />
        <Breakdown title="Actividades por estado" labels={EVENT_STATUSES} counts={data.events.byStatus} />
        <Breakdown title="Productos por estado" labels={PRODUCT_STATUSES} counts={data.products.byStatus} />
        <Breakdown title="Tareas por estado" labels={TASK_STATUS_LABELS} counts={data.tasks.byStatus} />
      </div>
    </div>
  );
}
