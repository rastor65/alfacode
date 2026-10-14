"use client";

import { CalendarDays, Pencil, Plus, UserRound } from "lucide-react";
import { type DragEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { formatCalendarDate } from "@/features/projects/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import {
  TASK_FILTER_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskFilter,
  type TaskItem,
  type TaskStatus,
  computeProgress,
  filterTasks,
  groupByStatus,
  isOverdue,
  isTaskStatus,
  sortTasks,
  todayInBogota,
} from "../types";
import { ProgressSummary } from "./progress-summary";
import { type AssigneeOption, TaskForm } from "./task-form";

const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }));
const DRAG_TYPE = "application/x-alfacode-task";

type Dialog = { mode: "create"; status: TaskStatus } | { mode: "view"; taskId: string } | { mode: "edit"; taskId: string } | null;

type TaskBoardProps = {
  projectId: string;
  initialTasks: TaskItem[];
  /** El backend devuelve hasta 200 tareas; si hay mas, se avisa. */
  totalTasks: number;
  assignees: AssigneeOption[];
  currentUserId: string;
  canManageTasks: boolean;
};

/**
 * Tablero Kanban basico (F2-11): una tarjeta por tarea y columnas fijas por estado. Mover una
 * tarjeta (con el selector o arrastrandola) es un PATCH de `status` que el backend autoriza.
 */
export function TaskBoard({ projectId, initialTasks, totalTasks, assignees, currentUserId, canManageTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState(() => sortTasks(initialTasks));
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const today = todayInBogota();
  const columns = groupByStatus(filterTasks(tasks, filter, currentUserId));
  const selected = dialog && dialog.mode !== "create" ? tasks.find((task) => task.id === dialog.taskId) : undefined;

  function replace(saved: TaskItem) {
    setTasks((current) => sortTasks([...current.filter((task) => task.id !== saved.id), saved]));
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
      <ProgressSummary progress={computeProgress(tasks)} />

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar tareas" className="flex flex-wrap gap-1.5">
          {(Object.keys(TASK_FILTER_LABELS) as TaskFilter[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                filter === key
                  ? "border-cyan-500 bg-hub-hover font-medium text-hub-text"
                  : "border-hub-border text-hub-muted hover:bg-hub-hover hover:text-hub-text",
              )}
            >
              {TASK_FILTER_LABELS[key]}
            </button>
          ))}
        </div>
        {canManageTasks && (
          <Button variant="neutral" className="min-h-10" onClick={() => setDialog({ mode: "create", status: "todo" })} aria-haspopup="dialog">
            <Plus size={16} className="mr-2" aria-hidden="true" />
            Nueva tarea
          </Button>
        )}
      </div>

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
              "flex min-h-40 flex-col rounded-xl border border-hub-border p-3 transition",
              dropTarget === status && "border-cyan-500 bg-hub-hover",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 id={`columna-${status}`} className="text-sm font-semibold text-hub-text">
                {TASK_STATUS_LABELS[status]}{" "}
                <span className="font-normal text-hub-muted">({columns[status].length})</span>
              </h2>
              {canManageTasks && (
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "create", status })}
                  aria-haspopup="dialog"
                  aria-label={`Nueva tarea en ${TASK_STATUS_LABELS[status]}`}
                  className="flex size-8 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {columns[status].length === 0 ? (
              <p className="mt-3 px-1 text-xs text-hub-muted">Sin tareas.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {columns[status].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    today={today}
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
              replace(saved);
              setNotice(`Tarea «${saved.title}» creada.`);
              setDialog(null);
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
            disabled={moving !== null}
            onEdit={() => setDialog({ mode: "edit", taskId: selected.id })}
            onMove={(next) => void move(selected, next)}
          />
        )}
      </Modal>
    </div>
  );
}

type TaskCardProps = {
  task: TaskItem;
  today: string;
  busy: boolean;
  disabled: boolean;
  onOpen: () => void;
  onMove: (status: TaskStatus) => void;
};

function TaskCard({ task, today, busy, disabled, onOpen, onMove }: TaskCardProps) {
  const overdue = isOverdue(task, today);

  return (
    <li
      draggable={task.permissions.canChangeStatus && !disabled}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      aria-busy={busy}
      className={cn(
        "rounded-lg border border-hub-border bg-hub-panel p-3",
        task.permissions.canChangeStatus && "cursor-grab active:cursor-grabbing",
        busy && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        className="w-full text-left text-sm font-medium text-hub-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        {task.title}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge className={cn(task.priority === "high" && "border-amber-500/60")}>Prioridad {TASK_PRIORITY_LABELS[task.priority].toLowerCase()}</Badge>
        {task.dueDate && (
          <Badge className={cn(overdue && "border-red-500/60")}>
            <CalendarDays size={12} className="mr-1" aria-hidden="true" />
            {overdue ? "Vencida: " : ""}
            {formatCalendarDate(task.dueDate)}
          </Badge>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-hub-muted">
        <UserRound size={12} aria-hidden="true" />
        {task.assignee?.fullName ?? "Sin responsable"}
      </p>
      {task.permissions.canChangeStatus && (
        <div className="mt-2">
          <OptionSelect
            id={`mover-${task.id}`}
            aria-label={`Estado de «${task.title}»`}
            options={STATUS_OPTIONS}
            value={task.status}
            disabled={disabled}
            className="h-8 text-xs"
            onValueChange={(value) => isTaskStatus(value) && onMove(value)}
          />
        </div>
      )}
    </li>
  );
}

type TaskDetailProps = {
  task: TaskItem;
  today: string;
  disabled: boolean;
  onEdit: () => void;
  onMove: (status: TaskStatus) => void;
};

function TaskDetail({ task, today, disabled, onEdit, onMove }: TaskDetailProps) {
  const overdue = isOverdue(task, today);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge>{TASK_STATUS_LABELS[task.status]}</Badge>
        <Badge>Prioridad {TASK_PRIORITY_LABELS[task.priority].toLowerCase()}</Badge>
        {overdue && <Badge className="border-red-500/60">Vencida</Badge>}
      </div>

      {task.description ? (
        <p className="whitespace-pre-line text-sm text-hub-soft">{task.description}</p>
      ) : (
        <p className="text-sm text-hub-muted">Sin descripción.</p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Responsable</dt>
          <dd className="mt-1 text-sm text-hub-text">{task.assignee?.fullName ?? "Sin responsable"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Fecha límite</dt>
          <dd className="mt-1 text-sm text-hub-text">{formatCalendarDate(task.dueDate) ?? "Sin definir"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Creada por</dt>
          <dd className="mt-1 text-sm text-hub-text">{task.createdBy?.fullName ?? "No disponible"}</dd>
        </div>
      </dl>

      {task.permissions.canChangeStatus && !task.permissions.canEdit && (
        <div className="space-y-1.5">
          <label htmlFor={`detalle-estado-${task.id}`} className="block text-sm font-medium text-hub-soft">
            Estado
          </label>
          <OptionSelect
            id={`detalle-estado-${task.id}`}
            options={STATUS_OPTIONS}
            value={task.status}
            disabled={disabled}
            onValueChange={(value) => isTaskStatus(value) && onMove(value)}
          />
        </div>
      )}

      {task.permissions.canEdit && (
        <Button variant="neutral" className="min-h-10" onClick={onEdit}>
          <Pencil size={15} className="mr-2" aria-hidden="true" />
          Editar tarea
        </Button>
      )}
    </div>
  );
}
