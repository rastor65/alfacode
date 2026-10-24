"use client";

import { ArrowUpDown, Clock, ListFilter, LayoutGrid, Plus, Rows3, Search, UserRound, UserX } from "lucide-react";
import { type DragEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import {
  SPRINT_STATUS_LABELS,
  type BoardScope,
  type SprintSummary,
  defaultScope,
  parseScope,
  scopeValue,
  tasksInScope,
} from "@/features/sprints/types";
import { panelCard } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import {
  DEFAULT_TASK_QUERY,
  TASK_SORT_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskItem,
  type TaskQuery,
  type TaskSort,
  type TaskStatus,
  type TasksView,
  computeProgress,
  groupByStatus,
  queryTasks,
  quickCounts,
  saveTasksView,
  sortTasks,
  todayInBogota,
} from "../types";
import { ScopeBanner } from "./scope-banner";
import { DRAG_TYPE, TaskCard } from "./task-card";
import { TaskDetail } from "./task-detail";
import { type AssigneeOption, TaskForm } from "./task-form";
import { TaskListView } from "./task-list-view";
import { STATUS_DOT } from "./task-ui";

type Dialog = { mode: "create"; status: TaskStatus } | { mode: "view"; taskId: string } | { mode: "edit"; taskId: string } | null;

type TaskBoardProps = {
  projectId: string;
  initialTasks: TaskItem[];
  /** El backend devuelve hasta 200 tareas; si hay mas, se avisa. */
  totalTasks: number;
  assignees: AssigneeOption[];
  currentUserId: string;
  canManageTasks: boolean;
  /** Solo en proyectos agiles: permite ver el sprint activo, el backlog o todo (F2-10, F2-20). */
  sprints?: SprintSummary[];
  initialView: TasksView;
};

const controlClass =
  "min-h-9 max-w-56 rounded-lg bg-hub-subtle px-2.5 text-sm text-hub-text focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent";
const toggleClass = (on: boolean) =>
  cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
    on ? "bg-hub-accent-soft text-hub-accent ring-1 ring-hub-accent" : "bg-hub-subtle text-hub-soft hover:bg-hub-hover",
  );

/**
 * Tablero Kanban (F2-11) y lista de tareas: una tarjeta por tarea y columnas fijas por estado. Mover una
 * tarjeta (con el selector o arrastrandola) es un PATCH de `status` que el backend autoriza.
 */
export function TaskBoard({ projectId, initialTasks, totalTasks, assignees, currentUserId, canManageTasks, sprints, initialView }: TaskBoardProps) {
  const [tasks, setTasks] = useState(() => sortTasks(initialTasks));
  const [scope, setScope] = useState<BoardScope>(() => (sprints ? defaultScope(sprints) : { kind: "all" }));
  const [query, setQuery] = useState<TaskQuery>(DEFAULT_TASK_QUERY);
  const [view, setView] = useState(initialView);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const today = todayInBogota();
  const scoped = tasksInScope(tasks, scope);
  const visible = queryTasks(scoped, query, today);
  const columns = groupByStatus(visible);
  const counts = quickCounts(scoped, currentUserId, today);
  const filtered = query.text.trim() !== "" || query.assignee !== "all" || query.overdue;
  const sprintNames = new Map((sprints ?? []).map((sprint) => [sprint.id, sprint.name]));
  const scopeSprint = scope.kind === "sprint" ? sprints?.find((sprint) => sprint.id === scope.sprintId) : undefined;
  const scopeOptions = sprints
    ? [
        ...sprints
          .filter((sprint) => sprint.status === "active" || sprint.status === "planned")
          .map((sprint) => ({ value: sprint.id, label: `${sprint.name} (${SPRINT_STATUS_LABELS[sprint.status].toLowerCase()})` })),
        { value: "backlog", label: "Backlog (sin sprint)" },
        { value: "all", label: "Todas las tareas" },
      ]
    : [];
  const selected = dialog && dialog.mode !== "create" ? tasks.find((task) => task.id === dialog.taskId) : undefined;
  const patch = (changes: Partial<TaskQuery>) => setQuery((current) => ({ ...current, ...changes }));

  function replace(saved: TaskItem) {
    setTasks((current) => sortTasks([...current.filter((task) => task.id !== saved.id), saved]));
  }

  function chooseView(next: TasksView) {
    setView(next);
    saveTasksView(next);
  }

  async function move(task: TaskItem, status: TaskStatus) {
    if (task.status === status || moving) {
      return;
    }

    setMoving(task.id);
    setError(null);
    setNotice(null);
    // Movimiento optimista; si el backend lo rechaza se restaura la tarea original.
    replace({ ...task, status });

    try {
      replace(await apiRequest<TaskItem>(`/projects/${projectId}/tasks/${task.id}`, { method: "PATCH", body: { status } }));
      setNotice(`«${task.title}» pasó a ${TASK_STATUS_LABELS[status].toLowerCase()}.`);
    } catch (caught) {
      replace(task);
      setError(describeError(caught));
    } finally {
      setMoving(null);
    }
  }

  /** Una tarea creada mientras se ve un sprint planificable se incorpora a ese sprint (F2-15). */
  async function created(saved: TaskItem) {
    if (!scopeSprint?.permissions.canPlan) {
      replace(saved);
      setNotice(`Tarea «${saved.title}» creada.`);
      return;
    }

    try {
      await apiRequest(`/projects/${projectId}/sprints/${scopeSprint.id}/tasks`, { method: "POST", body: { taskIds: [saved.id] } });
      replace({ ...saved, sprintId: scopeSprint.id });
      setNotice(`Tarea «${saved.title}» creada en ${scopeSprint.name}.`);
    } catch (caught) {
      replace(saved);
      setError(`La tarea se creó en el backlog, pero no se pudo agregar al sprint: ${describeError(caught)}`);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: TaskStatus) {
    event.preventDefault();
    setDropTarget(null);
    const task = tasks.find((item) => item.id === event.dataTransfer.getData(DRAG_TYPE));

    if (task?.permissions.canChangeStatus) {
      void move(task, status);
    }
  }

  return (
    <div className="space-y-5">
      <ScopeBanner
        projectId={projectId}
        scope={scope}
        sprint={scopeSprint}
        progress={computeProgress(scoped)}
        overdue={counts.overdue}
        unassigned={counts.unassigned}
        today={today}
      />

      <div role="search" className={cn(panelCard, "flex flex-col items-stretch justify-between gap-2 p-2 xl:flex-row xl:items-center")}>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Tipo de vista" className="inline-flex items-center gap-1 rounded-lg bg-hub-subtle p-1">
            {([["board", "Tablero", LayoutGrid], ["list", "Lista", Rows3]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => chooseView(value)}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent",
                  view === value ? "bg-hub-panel text-hub-accent shadow-sm" : "text-hub-muted hover:text-hub-text",
                )}
              >
                <Icon aria-hidden="true" className="size-4.5" />{label}
              </button>
            ))}
          </div>
          <label className="relative min-w-56 flex-1 xl:w-72 xl:flex-none">
            <span className="sr-only">Buscar tareas por título, descripción o responsable</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hub-muted" />
            <input
              type="search"
              value={query.text}
              maxLength={100}
              placeholder="Buscar tareas…"
              onChange={(event) => patch({ text: event.target.value })}
              className="min-h-9 w-full rounded-lg bg-hub-subtle py-1.5 pl-9 pr-3 text-sm text-hub-text placeholder:text-hub-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sprints && (
            <label className="flex items-center gap-1.5 text-xs text-hub-muted">
              <ListFilter aria-hidden="true" className="size-4" />Ver
              <select
                value={scopeValue(scope)}
                onChange={(event) => {
                  const next = parseScope(event.target.value, sprints);
                  if (next) setScope(next);
                }}
                className={controlClass}
              >
                {scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          <label className="flex items-center gap-1.5 text-xs text-hub-muted">
            <UserRound aria-hidden="true" className="size-4" />Responsable
            <select value={query.assignee} onChange={(event) => patch({ assignee: event.target.value })} className={controlClass}>
              <option value="all">Todos</option>
              <option value="none">Sin responsable</option>
              {assignees.map((member) => <option key={member.userId} value={member.userId}>{member.fullName}{member.userId === currentUserId ? " (tú)" : ""}</option>)}
            </select>
          </label>
          <button type="button" aria-pressed={query.assignee === currentUserId} onClick={() => patch({ assignee: query.assignee === currentUserId ? "all" : currentUserId })} className={toggleClass(query.assignee === currentUserId)}>
            <UserRound aria-hidden="true" className="size-4" />Mis tareas<span className="rounded-full bg-hub-border px-1.5 font-mono text-[11px] text-hub-text">{counts.mine}</span>
          </button>
          <button type="button" aria-pressed={query.assignee === "none"} onClick={() => patch({ assignee: query.assignee === "none" ? "all" : "none" })} className={toggleClass(query.assignee === "none")}>
            <UserX aria-hidden="true" className="size-4" />Sin responsable<span className="rounded-full bg-hub-border px-1.5 font-mono text-[11px] text-hub-text">{counts.unassigned}</span>
          </button>
          <button type="button" aria-pressed={query.overdue} onClick={() => patch({ overdue: !query.overdue })} className={cn(toggleClass(query.overdue), !query.overdue && counts.overdue > 0 && "text-hub-field-error")}>
            <Clock aria-hidden="true" className="size-4" />Vencidas<span className={cn("rounded-full px-1.5 font-mono text-[11px]", counts.overdue ? "bg-hub-danger-bg text-hub-danger-text" : "bg-hub-border text-hub-text")}>{counts.overdue}</span>
          </button>
          <label className="flex items-center gap-1.5 text-xs text-hub-muted">
            <ArrowUpDown aria-hidden="true" className="size-4" />Orden
            <select value={query.sort} onChange={(event) => patch({ sort: event.target.value as TaskSort })} className={controlClass}>
              {Object.entries(TASK_SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {canManageTasks && (
            <button
              type="button"
              onClick={() => setDialog({ mode: "create", status: "todo" })}
              aria-haspopup="dialog"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg"
            >
              <Plus aria-hidden="true" className="size-4" />Nueva tarea
            </button>
          )}
        </div>
      </div>

      {totalTasks > tasks.length && (
        <Alert tone="info">
          El tablero muestra {tasks.length} de {totalTasks} tareas. El progreso cuenta solo las mostradas.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {notice && (
        <p className="sr-only" role="status">
          {notice}
        </p>
      )}
      <p className="-mb-2 text-xs text-hub-muted" aria-live="polite">
        {visible.length === 1 ? "1 tarea" : `${visible.length} tareas`}{filtered ? ` de ${scoped.length} con los filtros actuales` : ""}
        {filtered && (
          <button type="button" onClick={() => setQuery((current) => ({ ...DEFAULT_TASK_QUERY, sort: current.sort }))} className="ml-2 font-medium text-hub-accent underline-offset-4 hover:underline">
            Quitar filtros
          </button>
        )}
      </p>

      {view === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <section
              key={status}
              aria-labelledby={`columna-${status}`}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes(DRAG_TYPE)) {
                  event.preventDefault();
                  setDropTarget(status);
                }
              }}
              onDragLeave={() => setDropTarget((current) => (current === status ? null : current))}
              onDrop={(event) => handleDrop(event, status)}
              className={cn(
                "flex min-h-40 flex-col gap-3 rounded-xl border border-hub-border bg-hub-subtle p-3 shadow-sm transition",
                dropTarget === status && "border-hub-accent bg-hub-accent-soft",
              )}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <h2 id={`columna-${status}`} className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-hub-text">
                  <span aria-hidden="true" className={cn("size-2.5 rounded-full", STATUS_DOT[status])} />
                  {TASK_STATUS_LABELS[status]}
                  <span className="rounded-full bg-hub-border px-1.5 font-mono text-[11px] font-semibold text-hub-muted">{columns[status].length}</span>
                </h2>
                {canManageTasks && (
                  <button
                    type="button"
                    onClick={() => setDialog({ mode: "create", status })}
                    aria-haspopup="dialog"
                    aria-label={`Nueva tarea en ${TASK_STATUS_LABELS[status]}`}
                    className="flex size-8 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {columns[status].length === 0 ? (
                <p className="rounded-lg border border-dashed border-hub-border px-3 py-6 text-center text-xs text-hub-muted">{filtered ? "Ninguna tarea coincide." : "Sin tareas."}</p>
              ) : (
                <ul className="space-y-2">
                  {columns[status].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      today={today}
                      sprintName={scope.kind === "all" && task.sprintId ? sprintNames.get(task.sprintId) : undefined}
                      busy={moving === task.id}
                      disabled={moving !== null}
                      onOpen={() => setDialog({ mode: "view", taskId: task.id })}
                      onMove={(next) => void move(task, next)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          {filtered ? "Ninguna tarea coincide con los filtros." : "Aún no hay tareas en esta vista."}
        </p>
      ) : (
        <TaskListView
          tasks={visible}
          today={today}
          sprintNames={sprintNames}
          showSprint={Boolean(sprints) && scope.kind === "all"}
          moving={moving}
          onOpen={(task) => setDialog({ mode: "view", taskId: task.id })}
          onMove={(task, next) => void move(task, next)}
        />
      )}

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "create" ? "Nueva tarea" : dialog?.mode === "edit" ? "Editar tarea" : (selected?.title ?? "Tarea")}
        size="lg"
      >
        {dialog?.mode === "create" && (
          <TaskForm
            projectId={projectId}
            assignees={assignees}
            initialStatus={dialog.status}
            onCancel={() => setDialog(null)}
            onSaved={(saved) => {
              setDialog(null);
              void created(saved);
            }}
          />
        )}
        {dialog?.mode === "edit" && selected && (
          <TaskForm
            projectId={projectId}
            assignees={assignees}
            task={selected}
            onCancel={() => setDialog({ mode: "view", taskId: selected.id })}
            onSaved={(saved) => {
              replace(saved);
              setNotice(`Tarea «${saved.title}» actualizada.`);
              setDialog({ mode: "view", taskId: saved.id });
            }}
          />
        )}
        {dialog?.mode === "view" && selected && (
          <TaskDetail
            task={selected}
            today={today}
            sprintName={selected.sprintId ? sprintNames.get(selected.sprintId) : undefined}
            disabled={moving !== null}
            onEdit={() => setDialog({ mode: "edit", taskId: selected.id })}
            onMove={(next) => void move(selected, next)}
          />
        )}
      </Modal>
    </div>
  );
}
