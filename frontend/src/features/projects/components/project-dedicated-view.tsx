"use client";

import { Bell, BookOpen, CalendarDays, Clock, FileText, FlaskConical, History, Layers, ListChecks, ShieldCheck, Sparkles, Timer, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { OptionSelect } from "@/components/ui/option-select";
import { AcademicCatalog } from "@/features/academic/components/academic-catalog";
import { PRODUCT_STATUSES, PRODUCT_TYPES, type AcademicItem, type AcademicKind, type AcademicPage } from "@/features/academic/types";
import { DocumentsList } from "@/features/documents/components/documents-list";
import type { DocumentList } from "@/features/documents/types";
import { EventsCatalog } from "@/features/events/components/events-catalog";
import { bogotaInput, EVENT_STATUSES, EVENT_TYPES, monthDays, monthShift, overlapsDay, type EventItem, type EventPage } from "@/features/events/types";
import { ProjectResearch } from "@/features/research/components/project-research";
import type { ProjectLines, ProjectProfile, ResultList } from "@/features/research/types";
import { SprintsList } from "@/features/sprints/components/sprints-list";
import { activeSprint, type SprintList } from "@/features/sprints/types";
import { TaskBoard } from "@/features/tasks/components/task-board";
import { TASK_STATUS_LABELS, type TaskList, type TasksView } from "@/features/tasks/types";
import { chip, dangerChip, neutralChip, panelCard } from "@/features/tracking/components/dashboard-ui";
import { Observations } from "@/features/tracking/components/observations";
import { Breakdown, Cutoff, Stat, StatGrid, TaskProgress } from "@/features/tracking/components/panel-ui";
import { plural, type ObservationList, type ProjectPanel } from "@/features/tracking/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { formatCalendarDate, PROJECT_ROLE_LABELS, type ProjectDetail, type ProjectSummary } from "../types";
import { ProjectActions } from "./project-actions";
import { type ProjectSection } from "./project-header";
import { ProjectOverviewContent } from "./project-overview";
import { ProjectPageHeader } from "./project-page-header";

const VALID_TABS: ProjectSection[] = [
  "resumen",
  "tareas",
  "sprints",
  "investigacion",
  "documentos",
  "produccion",
  "actividades",
  "seguimiento",
];

const TAB_CRUMBS: Record<ProjectSection, string | undefined> = {
  resumen: undefined,
  tareas: "Tareas",
  sprints: "Sprints",
  investigacion: "Investigación",
  documentos: "Documentos",
  produccion: "Producción académica",
  actividades: "Actividades",
  seguimiento: "Seguimiento",
};

export type ProjectDedicatedViewProps = {
  project: ProjectDetail;
  panel: ProjectPanel;
  observations: ObservationList;
  tasks: TaskList;
  sprints: SprintList;
  researchLines: ProjectLines;
  researchProfile: ProjectProfile;
  researchResults: ResultList;
  documents: DocumentList;
  academicProducts: AcademicPage;
  recognitions: AcademicPage;
  events: EventPage;
  projectsSummary?: ProjectSummary[];
  currentUserId: string;
  initialTasksView?: TasksView;
  initialTab?: ProjectSection;
};

export function ProjectDedicatedView({
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
  projectsSummary,
  currentUserId,
  initialTasksView,
  initialTab,
}: ProjectDedicatedViewProps) {
  const isAgile = project.methodology === "agile";
  const runningSprint = isAgile ? activeSprint(sprints.items) : null;
  const isFinished = project.status === "completed" || project.status === "cancelled";

  // Inicializar la pestaña a partir del prop o de la URL (?tab=...)
  const [activeTab, setActiveTab] = useState<ProjectSection>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") as ProjectSection | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        if (tabParam === "sprints" && !isAgile) return "resumen";
        return tabParam;
      }
    }
    if (initialTab && VALID_TABS.includes(initialTab)) {
      if (initialTab === "sprints" && !isAgile) return "resumen";
      return initialTab;
    }
    return "resumen";
  });

  // Cambiar pestaña sin recargar la vista pero sincronizando el historial del navegador
  const handleTabChange = useCallback(
    (tab: ProjectSection) => {
      if (tab === "sprints" && !isAgile) return;
      setActiveTab(tab);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (tab === "resumen") {
          url.searchParams.delete("tab");
        } else {
          url.searchParams.set("tab", tab);
        }
        window.history.pushState({ tab }, "", url.toString());
      }
    },
    [isAgile],
  );

  // Escuchar botones Atrás/Adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = (urlParams.get("tab") as ProjectSection) || "resumen";
      if (VALID_TABS.includes(tabParam)) {
        if (tabParam === "sprints" && !isAgile) {
          setActiveTab("resumen");
        } else {
          setActiveTab(tabParam);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAgile]);

  // Asignados activos para el tablero de tareas
  const assignees = useMemo(
    () =>
      project.members
        .filter((member) => member.accountStatus === "active")
        .map((member) => ({ userId: member.userId, fullName: member.fullName })),
    [project.members],
  );

  // Equipo para la ficha investigativa
  const team = useMemo(
    () => project.members.map((member) => ({ userId: member.userId, fullName: member.fullName })),
    [project.members],
  );

  // Documentos vinculados a resultados investigativos
  const resultDocuments = useMemo(
    () =>
      documents.items.flatMap((document) =>
        document.researchResult ? [{ id: document.id, title: document.title, resultId: document.researchResult.id }] : [],
      ),
    [documents.items],
  );

  // Alertas activas
  const alertsActive = panel.signals.risks.length > 0;

  // Crumb según pestaña
  const currentCrumb = isAgile && activeTab === "tareas" ? "Backlog y tablero" : TAB_CRUMBS[activeTab];

  return (
    <div className="mx-auto w-full max-w-430 flex flex-col gap-6">
      {/* Encabezado permanente con acciones y pestañas */}
      <ProjectPageHeader
        project={project}
        current={activeTab}
        crumb={currentCrumb}
        meta={
          <>
            {alertsActive && (
              <span className={`${dangerChip} gap-1`}>
                <Bell aria-hidden="true" className="size-3" />
                {plural(panel.signals.risks.length, "alerta activa", "alertas activas")}
              </span>
            )}
            {project.myRole && (
              <span className={`${chip} gap-1 bg-hub-accent-soft text-hub-accent`}>
                <ShieldCheck aria-hidden="true" className="size-3" />
                Tu rol: {PROJECT_ROLE_LABELS[project.myRole]}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-hub-muted">
              <Clock aria-hidden="true" className="size-3.5" />
              Datos al <time dateTime={panel.cutoff}>{formatDateTime(panel.cutoff)}</time> (Bogotá)
            </span>
          </>
        }
        actions={<ProjectActions project={project} />}
        badges={{
          tareas: <span className={`${neutralChip} rounded-full font-mono`}>{tasks.total}</span>,
          sprints: runningSprint ? (
            <span className={`${chip} rounded-full bg-hub-accent-soft text-hub-accent`}>{runningSprint.name}</span>
          ) : undefined,
        }}
        onTabChange={handleTabChange}
      />

      {/* Contenido interactivo según la pestaña activa */}
      <main role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="w-full">
        {activeTab === "resumen" && (
          <ProjectOverviewContent
            project={project}
            panel={panel}
            observations={observations}
            onNavigateTab={handleTabChange}
          />
        )}

        {activeTab === "tareas" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-xl border border-hub-border bg-hub-subtle px-4 py-3 text-sm text-hub-muted">
              <span>
                {isFinished
                  ? "El proyecto está finalizado: las tareas se pueden consultar, pero no cambiar."
                  : tasks.permissions.canManageTasks
                    ? "Crea y asigna tareas; mueve cada tarjeta entre columnas con su selector de estado o arrastrándola."
                    : "Puedes mover entre columnas las tareas que tienes asignadas."}
              </span>
              <span className="font-mono text-xs font-semibold text-hub-accent">
                {tasks.total} {tasks.total === 1 ? "tarea" : "tareas"}
              </span>
            </div>
            <TaskBoard
              projectId={project.id}
              initialTasks={tasks.items}
              totalTasks={tasks.total}
              assignees={assignees}
              currentUserId={currentUserId}
              canManageTasks={tasks.permissions.canManageTasks}
              sprints={isAgile ? sprints.items : undefined}
              initialView={initialTasksView}
            />
          </div>
        )}

        {activeTab === "sprints" && isAgile && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-hub-border bg-hub-subtle px-4 py-3 text-sm text-hub-muted">
              Un sprint agrupa tareas del backlog durante unas semanas. Solo puede haber uno activo; al cerrarlo, lo que
              no se terminó vuelve al backlog.
            </div>
            <SprintsList
              projectId={project.id}
              sprints={sprints.items}
              canCreate={sprints.permissions.canCreateSprints}
            />
          </div>
        )}

        {activeTab === "investigacion" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-hub-border bg-hub-subtle px-4 py-3 text-sm text-hub-muted">
              {isFinished
                ? "El proyecto está finalizado: su información investigativa se puede consultar, pero no cambiar."
                : "Información investigativa del proyecto. Las tareas y el cronograma siguen en su propia pestaña."}
            </div>
            <ProjectResearch
              projectId={project.id}
              researchProject={project.type === "research"}
              team={team}
              lines={researchLines}
              profile={researchProfile}
              results={researchResults}
              resultDocuments={resultDocuments}
            />
          </div>
        )}

        {activeTab === "documentos" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-hub-border bg-hub-subtle px-4 py-3 text-sm text-hub-muted">
              {isFinished
                ? "El proyecto está finalizado: sus documentos se pueden descargar, pero no cambiar."
                : "Propuestas, informes, entregables y evidencias del proyecto. Solo ves los documentos a los que tienes acceso."}
            </div>
            <DocumentsList
              documents={documents.items}
              scope="project"
              projectId={project.id}
              results={researchResults.items.map((result) => ({ id: result.id, title: result.title }))}
              limits={documents.upload}
              canUpload={Boolean(documents.permissions.canUpload)}
              emptyMessage="Aún no hay documentos en este proyecto que puedas consultar."
            />
            {documents.total > documents.items.length && (
              <p className="mt-1 text-sm text-hub-muted">
                Se muestran los {documents.items.length} más recientes de {documents.total}. Usa el repositorio de
                documentos para buscar.
              </p>
            )}
          </div>
        )}

        {activeTab === "produccion" && (
          <ProjectProductionPanel
            projectId={project.id}
            academicProducts={academicProducts}
            recognitions={recognitions}
            canEdit={project.permissions.canEdit}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "actividades" && (
          <ProjectEventsPanel
            project={project}
            events={events}
            currentUserId={currentUserId}
            projectsSummary={projectsSummary}
          />
        )}

        {activeTab === "seguimiento" && (
          <ProjectTrackingPanel
            project={project}
            panel={panel}
            observations={observations}
            onNavigateTab={handleTabChange}
          />
        )}
      </main>
    </div>
  );
}

/** Panel integrado de Producción y reconocimientos del proyecto */
function ProjectProductionPanel({
  projectId,
  academicProducts,
  recognitions,
  canEdit,
  currentUserId,
}: {
  projectId: string;
  academicProducts: AcademicPage;
  recognitions: AcademicPage;
  canEdit: boolean;
  currentUserId: string;
}) {
  const [kind, setKind] = useState<AcademicKind>("academic-products");
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [onlyMine, setOnlyMine] = useState(false);

  const rawItems = kind === "academic-products" ? academicProducts.items : recognitions.items;

  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (q.trim()) {
        const query = q.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesAuthor =
          item.authors?.some((a) => a.fullName.toLowerCase().includes(query)) ||
          item.user?.fullName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAuthor) return false;
      }

      if (kind === "academic-products") {
        if (type !== "all" && item.type !== type) return false;
        if (status !== "all" && item.status !== status) return false;
        if (onlyMine) {
          const isMine = item.authors?.some((a) => a.userId === currentUserId || a.id === currentUserId);
          if (!isMine) return false;
        }
      } else {
        if (onlyMine) {
          const isMine = item.user?.id === currentUserId;
          if (!isMine) return false;
        }
      }

      return true;
    });
  }, [rawItems, q, type, status, onlyMine, kind, currentUserId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hub-border pb-3">
        <nav aria-label="Tipo de producción" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setKind("academic-products")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              kind === "academic-products"
                ? "bg-cyan-500/15 text-hub-accent font-semibold shadow-sm ring-1 ring-cyan-500/30"
                : "text-hub-muted hover:bg-hub-subtle hover:text-hub-text",
            )}
          >
            Productos académicos ({academicProducts.items.length})
          </button>
          <button
            type="button"
            onClick={() => setKind("recognitions")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              kind === "recognitions"
                ? "bg-cyan-500/15 text-hub-accent font-semibold shadow-sm ring-1 ring-cyan-500/30"
                : "text-hub-muted hover:bg-hub-subtle hover:text-hub-text",
            )}
          >
            Reconocimientos ({recognitions.items.length})
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setOnlyMine((prev) => !prev)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition",
            onlyMine ? "bg-hub-accent-soft text-hub-accent font-semibold" : "text-hub-muted hover:text-hub-text",
          )}
        >
          {onlyMine ? "✓ Mostrando mi participación" : "Filtrar mi participación"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label="Buscar por título o autor"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribe para buscar…"
        />
        {kind === "academic-products" && (
          <>
            <div>
              <label htmlFor="prod-type" className="mb-1 block text-sm">
                Tipo
              </label>
              <OptionSelect
                id="prod-type"
                name="tipo"
                value={type}
                onChange={(val) => setType(val)}
                options={[{ value: "all", label: "Todos los tipos" }, ...Object.entries(PRODUCT_TYPES).map(([value, label]) => ({ value, label }))]}
              />
            </div>
            <div>
              <label htmlFor="prod-status" className="mb-1 block text-sm">
                Estado
              </label>
              <OptionSelect
                id="prod-status"
                name="estado"
                value={status}
                onChange={(val) => setStatus(val)}
                options={[{ value: "all", label: "Todos los estados" }, ...Object.entries(PRODUCT_STATUSES).map(([value, label]) => ({ value, label }))]}
              />
            </div>
          </>
        )}
      </div>

      <AcademicCatalog
        key={kind}
        kind={kind}
        items={filteredItems}
        projectId={projectId}
        canCreate={canEdit}
        canCreateInstitutional={false}
      />
    </div>
  );
}

/** Panel integrado de Actividades del proyecto */
function ProjectEventsPanel({
  project,
  events,
  currentUserId,
  projectsSummary,
}: {
  project: ProjectDetail;
  events: EventPage;
  currentUserId: string;
  projectsSummary?: ProjectSummary[];
}) {
  const [view, setView] = useState<"calendar" | "agenda">("calendar");
  const today = useMemo(() => bogotaInput(new Date()).slice(0, 10), []);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const days = useMemo(() => monthDays(month), [month]);
  const offset = useMemo(() => (new Date(`${month}-01T12:00:00Z`).getUTCDay() + 6) % 7, [month]);
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" }).format(
        new Date(`${month}-15T12:00:00Z`),
      ),
    [month],
  );

  const filteredEvents = useMemo(() => {
    return events.items.filter((event) => {
      if (q.trim()) {
        const query = q.toLowerCase();
        if (!event.title.toLowerCase().includes(query)) return false;
      }
      if (type !== "all" && event.type !== type) return false;
      if (status !== "all" && event.status !== status) return false;
      if (view === "calendar" && selectedDay) {
        if (!overlapsDay(event, selectedDay)) return false;
      }
      return true;
    });
  }, [events.items, q, type, status, view, selectedDay]);

  const projectsList = useMemo(
    () =>
      projectsSummary ?? [
        {
          id: project.id,
          name: project.name,
          status: project.status,
          methodology: project.methodology,
          type: project.type,
          myRole: project.myRole,
          memberCount: project.members.length,
          leaderNames: project.members
            .filter((m) => m.role === "leader")
            .map((m) => m.fullName)
            .join(", "),
        } as ProjectSummary,
      ],
    [project, projectsSummary],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hub-border pb-3">
        <nav aria-label="Vista de actividades" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setView("calendar");
              setSelectedDay(null);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              view === "calendar"
                ? "bg-cyan-500/15 text-hub-accent font-semibold shadow-sm ring-1 ring-cyan-500/30"
                : "text-hub-muted hover:bg-hub-subtle hover:text-hub-text",
            )}
          >
            Calendario mensual
          </button>
          <button
            type="button"
            onClick={() => {
              setView("agenda");
              setSelectedDay(null);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              view === "agenda"
                ? "bg-cyan-500/15 text-hub-accent font-semibold shadow-sm ring-1 ring-cyan-500/30"
                : "text-hub-muted hover:bg-hub-subtle hover:text-hub-text",
            )}
          >
            Agenda desde hoy
          </button>
        </nav>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          label="Buscar actividad"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escribe para buscar…"
        />
        <div>
          <label htmlFor="evt-type" className="mb-1 block text-sm">
            Tipo
          </label>
          <OptionSelect
            id="evt-type"
            name="tipo"
            value={type}
            onChange={(val) => setType(val)}
            options={[{ value: "all", label: "Todos los tipos" }, ...Object.entries(EVENT_TYPES).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <div>
          <label htmlFor="evt-status" className="mb-1 block text-sm">
            Estado
          </label>
          <OptionSelect
            id="evt-status"
            name="estado"
            value={status}
            onChange={(val) => setStatus(val)}
            options={[{ value: "all", label: "Todos los estados" }, ...Object.entries(EVENT_STATUSES).map(([value, label]) => ({ value, label }))]}
          />
        </div>
      </div>

      {view === "calendar" && (
        <section aria-label={`Calendario de ${monthLabel}`} className="rounded-xl border border-hub-border p-3 sm:p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setMonth((m) => monthShift(m, -1));
                setSelectedDay(null);
              }}
              className="inline-flex min-h-9 items-center text-sm font-medium text-hub-accent underline-offset-4 hover:underline"
            >
              ← Mes anterior
            </button>
            <h3 className="font-semibold capitalize text-hub-text">{monthLabel}</h3>
            <button
              type="button"
              onClick={() => {
                setMonth((m) => monthShift(m, 1));
                setSelectedDay(null);
              }}
              className="inline-flex min-h-9 items-center text-sm font-medium text-hub-accent underline-offset-4 hover:underline"
            >
              Mes siguiente →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((name, i) => (
              <abbr key={name} title={name} className="pb-2 text-xs text-hub-muted no-underline">
                {["L", "M", "X", "J", "V", "S", "D"][i]}
              </abbr>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`blank-${i}`} aria-hidden="true" />
            ))}
            {days.map((date) => {
              const count = events.items.filter((e) => overlapsDay(e, date)).length;
              const isSelected = date === selectedDay;
              const isToday = date === today;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDay((curr) => (curr === date ? null : date))}
                  aria-label={`${date}${isToday ? ", hoy" : ""}: ${count} actividades`}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center rounded-lg border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/10 font-bold text-hub-accent"
                      : "border-hub-border hover:bg-hub-hover text-hub-text",
                    isToday && !isSelected && "ring-1 ring-cyan-500 font-bold",
                  )}
                >
                  <span>{Number(date.slice(-2))}</span>
                  {count > 0 && (
                    <span className="mt-1 text-xs font-semibold text-hub-accent">
                      {count}
                      <span className="sr-only"> actividades</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-3 flex items-center justify-between text-xs text-hub-muted">
              <span>Filtrando por día: {selectedDay}</span>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-hub-accent underline-offset-4 hover:underline"
              >
                Ver todo el mes
              </button>
            </div>
          )}
        </section>
      )}

      <EventsCatalog
        events={filteredEvents}
        projects={projectsList}
        institutional={false}
        viewerId={currentUserId}
        projectId={project.id}
        canCreate={project.permissions.canEdit}
      />
    </div>
  );
}

/** Panel integrado de Seguimiento operativo y observaciones */
function ProjectTrackingPanel({
  project,
  panel,
  observations,
  onNavigateTab,
}: {
  project: ProjectDetail;
  panel: ProjectPanel;
  observations: ObservationList;
  onNavigateTab?: (tab: ProjectSection) => void;
}) {
  const dates = [
    project.startDate && `Inicio: ${formatCalendarDate(project.startDate)}`,
    project.endDate && `Fin planificado: ${formatCalendarDate(project.endDate)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-xl border border-hub-border bg-hub-subtle p-4">
        <p className="text-sm text-hub-muted">
          El avance cuenta tareas terminadas sobre el total: es una referencia de actividad, no mide la calidad ni el
          logro de los objetivos.
        </p>
        {dates && <p className="text-sm font-medium text-hub-text">{dates}</p>}
        <Cutoff value={panel.cutoff} />
      </div>

      <section className="space-y-4 rounded-2xl border border-hub-border p-4">
        <TaskProgress title="Avance de tareas" summary={panel.tasks} />
        {panel.sprints?.active && (
          <TaskProgress
            title={`Sprint activo: ${panel.sprints.active.name} (${formatCalendarDate(panel.sprints.active.startDate)} – ${formatCalendarDate(panel.sprints.active.endDate)})`}
            summary={panel.sprints.active.tasks}
          />
        )}
        {panel.sprints && !panel.sprints.active && <p className="text-sm text-hub-muted">No hay un sprint activo.</p>}
        {panel.sprints?.lastCompleted && (
          <TaskProgress
            title={`Último sprint cerrado: ${panel.sprints.lastCompleted.name} (registro al cierre)`}
            summary={panel.sprints.lastCompleted.tasks}
          />
        )}
      </section>

      <div>
        <StatGrid label="Indicadores del proyecto">
          <Stat
            label="Tareas pendientes"
            value={panel.tasks.pending}
            hint={plural(panel.tasks.done, "terminada", "terminadas")}
            href={`/hub/proyectos/${project.id}?tab=tareas`}
            onClick={(e) => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab("tareas");
              }
            }}
          />
          <Stat
            label="Tareas vencidas"
            value={panel.tasks.overdue}
            hint="Fecha límite anterior a hoy, sin terminar"
          />
          <Stat label="Vencen en 7 días" value={panel.tasks.dueSoon} />
          <Stat label="Sin responsable" value={panel.tasks.unassigned} hint="Tareas abiertas sin asignar" />
          <Stat
            label="Resultados investigativos"
            value={panel.deliverables.researchResults}
            href={`/hub/proyectos/${project.id}?tab=investigacion`}
            onClick={(e) => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab("investigacion");
              }
            }}
          />
          <Stat
            label="Productos académicos"
            value={panel.deliverables.products.total}
            href={`/hub/proyectos/${project.id}?tab=produccion`}
            onClick={(e) => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab("produccion");
              }
            }}
          />
          <Stat
            label="Equipo"
            value={panel.team.members}
            hint={panel.team.leaders === 1 ? "1 líder" : `${panel.team.leaders} líderes`}
          />
          <Stat
            label="Actividades"
            value={panel.events.total}
            hint={plural(panel.events.byStatus.completed, "realizada", "realizadas")}
            href={`/hub/proyectos/${project.id}?tab=actividades`}
            onClick={(e) => {
              if (onNavigateTab) {
                e.preventDefault();
                onNavigateTab("actividades");
              }
            }}
          />
        </StatGrid>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Breakdown title="Tareas por estado" labels={TASK_STATUS_LABELS} counts={panel.tasks.byStatus} />
        <Breakdown title="Productos por estado" labels={PRODUCT_STATUSES} counts={panel.deliverables.products.byStatus} />
        <Breakdown title="Actividades por estado" labels={EVENT_STATUSES} counts={panel.events.byStatus} />
      </div>

      <div>
        <Observations projectId={project.id} initial={observations} />
      </div>
    </div>
  );
}
