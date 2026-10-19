"use client";

import { ListPlus, Pencil, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { formatCalendarDate } from "@/features/projects/types";
import { ProgressSummary } from "@/features/tasks/components/progress-summary";
import { TASK_STATUS_LABELS, type TaskList } from "@/features/tasks/types";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import { SPRINT_STATUS_LABELS, type SprintDetail } from "../types";
import { SprintForm } from "./sprint-form";

type Pending = "start" | "complete" | "cancel" | null;
type BacklogTask = { id: string; title: string };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hub-border pt-5">
      <h3 className="text-base font-semibold text-hub-text">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

type SprintDetailContentProps = {
  projectId: string;
  sprint: SprintDetail;
  /** Se llama tras cada cambio con el sprint actualizado. */
  onChanged: (sprint: SprintDetail) => void;
};

/** Detalle de un sprint (dentro de un modal): planificacion, ciclo de vida e historial. */
export function SprintDetailContent({ projectId, sprint, onChanged }: SprintDetailContentProps) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [backlog, setBacklog] = useState<BacklogTask[] | null>(null);
  const { permissions } = sprint;
  const base = `/projects/${projectId}/sprints/${sprint.id}`;
  const unfinished = sprint.tasks.filter((task) => task.status !== "done").length;

  async function run(key: string, action: () => Promise<SprintDetail>, message: string) {
    setBusy(key);
    setError(null);
    setNotice(null);

    try {
      onChanged(await action());
      setNotice(message);
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setBusy(null);
    }
  }

  /** Tareas del backlog del proyecto; se piden al abrir la planificacion (evento). */
  async function loadBacklog() {
    setBacklog([]);

    try {
      const response = await apiRequest<TaskList>(`/projects/${projectId}/tasks?sprintId=none&pageSize=200`);
      setBacklog(response.items.map((task) => ({ id: task.id, title: task.title })));
    } catch (caught) {
      setError(describeError(caught));
      setBacklog(null);
    }
  }

  function addTasks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const taskIds = new FormData(event.currentTarget).getAll("taskIds").map(String);

    if (taskIds.length === 0) {
      setError("Selecciona al menos una tarea del backlog.");
      return;
    }

    void run(
      "add",
      () => apiRequest<SprintDetail>(`${base}/tasks`, { method: "POST", body: { taskIds } }),
      taskIds.length === 1 ? "Se agregó 1 tarea al sprint." : `Se agregaron ${taskIds.length} tareas al sprint.`,
    ).then((done) => done && setBacklog(null));
  }

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    const action = pending;

    if (action === "start") {
      void run("confirm", () => apiRequest<SprintDetail>(`${base}/start`, { method: "POST" }), "El sprint está activo.").then(
        (done) => done && setPending(null),
      );
    } else if (action === "complete") {
      void run(
        "confirm",
        () => apiRequest<SprintDetail>(`${base}/complete`, { method: "POST" }),
        "Sprint cerrado. Las tareas pendientes volvieron al backlog.",
      ).then((done) => done && setPending(null));
    } else if (action === "cancel") {
      void run(
        "confirm",
        () => apiRequest<SprintDetail>(`${base}/cancel`, { method: "POST", body: { reason } }),
        "Sprint cancelado. Las tareas pendientes volvieron al backlog.",
      ).then((done) => done && setPending(null));
    }
  }

  if (editing) {
    return (
      <SprintForm
        projectId={projectId}
        sprint={sprint}
        onCancel={() => setEditing(false)}
        onSaved={(saved) => {
          setEditing(false);
          setNotice("Sprint actualizado.");
          onChanged(saved);
        }}
      />
    );
  }

  const finished = sprint.status === "completed" || sprint.status === "cancelled";

  return (
    <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Badge>{SPRINT_STATUS_LABELS[sprint.status]}</Badge>
        <Badge>
          {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
        </Badge>
      </div>

      {sprint.goal && <p className="whitespace-pre-line text-sm text-hub-soft">{sprint.goal}</p>}
      {sprint.cancelReason && <p className="text-sm text-hub-muted">Motivo de la cancelación: {sprint.cancelReason}</p>}

      <ProgressSummary progress={sprint.progress} />
      {finished && <p className="-mt-3 text-xs text-hub-muted">Según el registro tomado al finalizar el sprint.</p>}

      {permissions.canEdit && (
        <Button variant="neutral" className="min-h-10" onClick={() => setEditing(true)} disabled={busy !== null}>
          <Pencil size={15} className="mr-2" aria-hidden="true" />
          Editar sprint
        </Button>
      )}

      {(permissions.canStart || permissions.canComplete || permissions.canCancel) && (
        <Section title="Ciclo del sprint">
          {pending ? (
            <form onSubmit={confirm} className="space-y-3">
              <p className="text-sm text-hub-text">
                {pending === "start" && "El sprint pasará a activo. Solo puede haber un sprint activo por proyecto."}
                {pending === "complete" &&
                  (unfinished > 0
                    ? `Se registrará el estado de cada tarea. ${unfinished === 1 ? "La tarea sin terminar volverá" : `Las ${unfinished} tareas sin terminar volverán`} al backlog sin marcarse como hechas.`
                    : "Se registrará el estado de cada tarea. Todas están hechas.")}
                {pending === "cancel" && "El sprint se cancelará; las tareas sin terminar volverán al backlog. No podrá reactivarse."}
              </p>
              {pending === "cancel" && <TextAreaField label="Motivo" name="reason" required minLength={3} maxLength={500} rows={2} />}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="min-h-10" pending={busy === "confirm"} pendingLabel="Guardando…">
                  Confirmar
                </Button>
                <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setPending(null)} disabled={busy !== null}>
                  Volver
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.canStart && (
                <Button variant="neutral" className="min-h-10" onClick={() => setPending("start")}>
                  Iniciar sprint
                </Button>
              )}
              {permissions.canComplete && (
                <Button variant="neutral" className="min-h-10" onClick={() => setPending("complete")}>
                  Cerrar sprint
                </Button>
              )}
              {permissions.canCancel && (
                <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setPending("cancel")}>
                  Cancelar sprint
                </Button>
              )}
            </div>
          )}
        </Section>
      )}

      {finished ? (
        <Section title={`Historial al finalizar (${sprint.closure.length})`}>
          {sprint.closure.length === 0 ? (
            <p className="text-sm text-hub-muted">El sprint no tenía tareas.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-hub-border">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-hub-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">Tarea</th>
                    <th scope="col" className="px-4 py-2 font-medium">Al finalizar</th>
                    <th scope="col" className="px-4 py-2 font-medium">Ahora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub-border">
                  {sprint.closure.map((item) => (
                    <tr key={item.taskId}>
                      <td className="px-4 py-2 text-hub-text">{item.title}</td>
                      <td className="px-4 py-2 text-hub-soft">{TASK_STATUS_LABELS[item.statusAtClose]}</td>
                      <td className="px-4 py-2 text-hub-muted">{TASK_STATUS_LABELS[item.currentStatus]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      ) : (
        <Section title={`Tareas del sprint (${sprint.tasks.length})`}>
          {sprint.tasks.length === 0 ? (
            <p className="text-sm text-hub-muted">Sin tareas. Agrégalas desde el backlog.</p>
          ) : (
            <ul className="divide-y divide-hub-border rounded-xl border border-hub-border">
              {sprint.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-hub-text">{task.title}</p>
                    <p className="truncate text-xs text-hub-muted">
                      {TASK_STATUS_LABELS[task.status]} · {task.assignee?.fullName ?? "Sin responsable"}
                    </p>
                  </div>
                  {permissions.canPlan && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(
                          `remove-${task.id}`,
                          () => apiRequest<SprintDetail>(`${base}/tasks/${task.id}`, { method: "DELETE" }),
                          `«${task.title}» volvió al backlog.`,
                        )
                      }
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50"
                      aria-label={`Devolver «${task.title}» al backlog`}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {permissions.canPlan &&
            (backlog === null ? (
              <Button variant="neutral" className="mt-3 min-h-10" onClick={() => void loadBacklog()} disabled={busy !== null}>
                <ListPlus size={15} className="mr-2" aria-hidden="true" />
                Agregar tareas del backlog
              </Button>
            ) : (
              <form onSubmit={addTasks} className="mt-3 space-y-3 rounded-xl border border-hub-border p-4">
                {backlog.length === 0 ? (
                  <p className="text-sm text-hub-muted">El backlog está vacío.</p>
                ) : (
                  <fieldset>
                    <legend className="text-sm font-medium text-hub-soft">Tareas del backlog</legend>
                    <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                      {backlog.map((task) => (
                        <li key={task.id}>
                          <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-hub-text hover:bg-hub-hover">
                            <input type="checkbox" name="taskIds" value={task.id} className="size-4 accent-cyan-600" />
                            {task.title}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}
                <div className="flex flex-wrap gap-2">
                  {backlog.length > 0 && (
                    <Button type="submit" className="min-h-10" pending={busy === "add"} pendingLabel="Agregando…">
                      Agregar seleccionadas
                    </Button>
                  )}
                  <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setBacklog(null)} disabled={busy !== null}>
                    Cerrar
                  </Button>
                </div>
              </form>
            ))}
        </Section>
      )}
    </div>
  );
}
