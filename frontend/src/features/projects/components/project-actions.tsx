"use client";

import { ArrowRightLeft, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { apiRequest } from "@/lib/api/client";
import { ApiRequestError, describeError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import {
  METHODOLOGY_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectDetail,
  type ProjectRole,
  type ProjectStatus,
  STATUS_ACTION_LABELS,
} from "../types";
import { ProjectForm } from "./project-form";

const ROLE_OPTIONS = Object.entries(PROJECT_ROLE_LABELS).map(([value, label]) => ({ value, label }));
const secondary =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-hub-border bg-hub-subtle px-3 text-sm font-medium text-hub-text transition-colors hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-60";
const primary =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg";

type Candidate = { id: string; fullName: string };
type Dialog = "edit" | "status" | "team" | null;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hub-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-base font-semibold text-hub-text">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Acciones sobre el proyecto (I-27, detalle): editar datos, estado y modalidad, y equipo. Cada una abre
 * su dialogo y solo aparece si los permisos lo permiten; el backend vuelve a comprobarlos.
 */
export function ProjectActions({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const newMemberId = useId();
  const newRoleId = useId();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [confirmMethodology, setConfirmMethodology] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  /** F2-04: persona con tareas abiertas cuyo retiro espera confirmacion para desasignarlas. */
  const [pendingRemoval, setPendingRemoval] = useState<{ userId: string; fullName: string; openTasks: number } | null>(null);
  const { permissions } = project;
  const canSettings = permissions.allowedTransitions.length > 0 || permissions.canChangeMethodology;

  function show(next: Dialog) {
    setError(null);
    setNotice(null);
    setPendingStatus(null);
    setConfirmMethodology(false);
    setCandidates(null);
    setPendingRemoval(null);
    setDialog(next);
  }

  async function run(key: string, action: () => Promise<unknown>, message: string) {
    setBusy(key);
    setError(null);
    setNotice(null);

    try {
      await action();
      setNotice(message);
      router.refresh();
      return true;
    } catch (caught) {
      setError(describeError(caught));
      return false;
    } finally {
      setBusy(null);
    }
  }

  /** Integrantes activos que aun no estan en el proyecto; se piden al abrir el formulario (evento). */
  async function loadCandidates() {
    setCandidates([]);

    try {
      const response = await apiRequest<{ items: Candidate[] }>("/users?status=active&pageSize=100");
      const current = new Set(project.members.map((member) => member.userId));
      setCandidates(response.items.filter((user) => !current.has(user.id)));
    } catch (caught) {
      setError(describeError(caught));
      setCandidates(null);
    }
  }

  async function removeMember(userId: string, fullName: string, unassignTasks: boolean) {
    setBusy(`remove-${userId}`);
    setError(null);
    setNotice(null);

    try {
      await apiRequest(`/projects/${project.id}/members/${userId}${unassignTasks ? "?unassignTasks=true" : ""}`, { method: "DELETE" });
      setPendingRemoval(null);
      setNotice(
        unassignTasks
          ? `${fullName} ya no pertenece al proyecto; sus tareas abiertas quedaron sin responsable.`
          : `${fullName} ya no pertenece al proyecto.`,
      );
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.code === "MEMBER_HAS_ASSIGNED_TASKS" && !unassignTasks) {
        const openTasks = Number((caught.details as { openTasks?: unknown } | null)?.openTasks) || 1;
        setPendingRemoval({ userId, fullName, openTasks });
      } else {
        setError(describeError(caught));
      }
    } finally {
      setBusy(null);
    }
  }

  function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!pendingStatus) {
      return;
    }

    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    const status = pendingStatus;
    void run(
      "status",
      () => apiRequest(`/projects/${project.id}/status`, { method: "POST", body: { status, ...(reason ? { reason } : {}) } }),
      `El proyecto ahora está ${PROJECT_STATUS_LABELS[status].toLowerCase()}.`,
    ).then((done) => {
      if (done) setPendingStatus(null);
    });
  }

  const feedback = (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
    </>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {permissions.canEdit && (
          <button type="button" onClick={() => show("edit")} aria-haspopup="dialog" className={secondary}>
            <Pencil aria-hidden="true" className="size-4" />Editar
          </button>
        )}
        {canSettings && (
          <button type="button" onClick={() => show("status")} aria-haspopup="dialog" className={secondary}>
            <ArrowRightLeft aria-hidden="true" className="size-4" />Estado
          </button>
        )}
        {permissions.canManageMembers && (
          <button type="button" onClick={() => show("team")} aria-haspopup="dialog" className={primary}>
            <Users aria-hidden="true" className="size-4" />Gestionar equipo
          </button>
        )}
      </div>

      <Modal open={dialog === "edit"} onClose={() => show(null)} title="Editar proyecto" size="lg">
        {dialog === "edit" && (
          <ProjectForm
            project={project}
            onCancel={() => show(null)}
            onSaved={() => {
              show(null);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={dialog === "status"} onClose={() => show(null)} title="Estado y modalidad" size="lg">
        {dialog === "status" && (
          <div className="space-y-5">
            {feedback}
            <p className="text-sm text-hub-muted">
              Estado actual: <strong className="text-hub-text">{PROJECT_STATUS_LABELS[project.status]}</strong> · Modalidad:{" "}
              <strong className="text-hub-text">{METHODOLOGY_LABELS[project.methodology]}</strong>
            </p>

            {permissions.allowedTransitions.length > 0 && (
              <Section title="Estado">
                {pendingStatus ? (
                  <form onSubmit={changeStatus} className="space-y-3">
                    <p className="text-sm text-hub-text">
                      {STATUS_ACTION_LABELS[pendingStatus]}: el proyecto pasará a «{PROJECT_STATUS_LABELS[pendingStatus]}».
                      {(pendingStatus === "completed" || pendingStatus === "cancelled") && " Después no podrá editarse ni reactivarse."}
                    </p>
                    <TextAreaField label="Motivo (opcional)" name="reason" maxLength={500} rows={2} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" className="min-h-10" pending={busy === "status"} pendingLabel="Guardando…">
                        Confirmar
                      </Button>
                      <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setPendingStatus(null)} disabled={busy !== null}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {permissions.allowedTransitions.map((status) => (
                      <Button key={status} variant="neutral" className="min-h-10" disabled={busy !== null} onClick={() => setPendingStatus(status)}>
                        {STATUS_ACTION_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {permissions.canChangeMethodology && (
              <Section title="Modalidad">
                {confirmMethodology ? (
                  <div className="space-y-3">
                    <p className="text-sm text-hub-text">
                      {project.methodology === "traditional"
                        ? "El proyecto pasará a modalidad ágil: todas sus tareas quedarán en el backlog y podrás organizarlas en sprints."
                        : "El proyecto pasará a modalidad tradicional. Solo es posible si nunca ha tenido sprints."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="min-h-10"
                        pending={busy === "methodology"}
                        pendingLabel="Guardando…"
                        onClick={() => {
                          const methodology = project.methodology === "agile" ? "traditional" : "agile";
                          void run(
                            "methodology",
                            () => apiRequest(`/projects/${project.id}/methodology`, { method: "POST", body: { methodology } }),
                            `El proyecto ahora es de modalidad ${METHODOLOGY_LABELS[methodology].toLowerCase()}.`,
                          ).then((done) => {
                            if (done) setConfirmMethodology(false);
                          });
                        }}
                      >
                        Confirmar
                      </Button>
                      <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setConfirmMethodology(false)} disabled={busy !== null}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="neutral" className="min-h-10" onClick={() => setConfirmMethodology(true)} disabled={busy !== null}>
                    Cambiar a {METHODOLOGY_LABELS[project.methodology === "agile" ? "traditional" : "agile"].toLowerCase()}
                  </Button>
                )}
              </Section>
            )}
          </div>
        )}
      </Modal>

      <Modal open={dialog === "team"} onClose={() => show(null)} title={`Equipo (${project.members.length})`} size="lg">
        {dialog === "team" && (
          <div className="space-y-4">
            {feedback}
            {pendingRemoval && (
              <div className="space-y-3 rounded-xl border border-hub-border p-4" role="group" aria-label="Confirmar retiro">
                <p className="text-sm text-hub-text">
                  {pendingRemoval.fullName} tiene {pendingRemoval.openTasks === 1 ? "1 tarea abierta" : `${pendingRemoval.openTasks} tareas abiertas`} en el
                  proyecto. Si la retiras, esas tareas quedarán sin responsable; las tareas hechas conservan su nombre.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-10"
                    pending={busy === `remove-${pendingRemoval.userId}`}
                    pendingLabel="Retirando…"
                    onClick={() => void removeMember(pendingRemoval.userId, pendingRemoval.fullName, true)}
                  >
                    Desasignar y retirar
                  </Button>
                  <Button variant="ghost" className="w-auto min-h-10 px-4" onClick={() => setPendingRemoval(null)} disabled={busy !== null}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {project.members.length === 0 ? (
              <p className="text-sm text-hub-muted">Sin integrantes. Asigna al menos un líder antes de activar el proyecto.</p>
            ) : (
              <ul className="divide-y divide-hub-border rounded-xl border border-hub-border">
                {project.members.map((member) => (
                  <li key={member.userId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-hub-text">{member.fullName}</p>
                      {member.email && <p className="truncate text-xs text-hub-muted">{member.email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <OptionSelect
                        id={`${newRoleId}-${member.userId}`}
                        aria-label={`Rol de ${member.fullName} en el proyecto`}
                        options={ROLE_OPTIONS}
                        value={member.role}
                        disabled={busy !== null}
                        className="h-9 w-36"
                        onValueChange={(role) =>
                          void run(
                            `role-${member.userId}`,
                            () => apiRequest(`/projects/${project.id}/members/${member.userId}`, { method: "PATCH", body: { role } }),
                            `${member.fullName} ahora es ${PROJECT_ROLE_LABELS[role as ProjectRole].toLowerCase()}.`,
                          )
                        }
                      />
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => void removeMember(member.userId, member.fullName, false)}
                        className={cn("flex size-9 items-center justify-center rounded-lg text-hub-muted transition hover:bg-hub-hover hover:text-hub-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent disabled:opacity-50")}
                        aria-label={`Retirar a ${member.fullName} del proyecto`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {candidates === null ? (
              <Button variant="neutral" className="min-h-10" onClick={() => void loadCandidates()} disabled={busy !== null}>
                <UserPlus size={15} className="mr-2" aria-hidden="true" />
                Agregar integrante
              </Button>
            ) : (
              <form
                className="grid gap-3 rounded-xl border border-hub-border p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const userId = String(form.get("userId") ?? "");
                  const role = String(form.get("role") ?? "collaborator");
                  const name = candidates.find((candidate) => candidate.id === userId)?.fullName ?? "La persona";
                  void run(
                    "add",
                    () => apiRequest(`/projects/${project.id}/members`, { method: "POST", body: { userId, role } }),
                    `${name} se unió al proyecto.`,
                  ).then((done) => {
                    if (done) setCandidates(null);
                  });
                }}
              >
                {candidates.length === 0 ? (
                  <p className="text-sm text-hub-muted sm:col-span-3">No hay más integrantes activos para agregar.</p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor={newMemberId} className="block text-sm font-medium text-hub-soft">
                        Integrante
                      </label>
                      <OptionSelect
                        id={newMemberId}
                        name="userId"
                        options={candidates.map((candidate) => ({ value: candidate.id, label: candidate.fullName }))}
                        defaultValue={candidates[0].id}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={newRoleId} className="block text-sm font-medium text-hub-soft">
                        Rol
                      </label>
                      <OptionSelect id={newRoleId} name="role" options={ROLE_OPTIONS} defaultValue="collaborator" />
                    </div>
                    <Button type="submit" className="min-h-11" pending={busy === "add"} pendingLabel="Agregando…">
                      Agregar
                    </Button>
                  </>
                )}
                <Button variant="ghost" className="w-auto min-h-10 px-4 sm:col-span-3 sm:justify-self-start" onClick={() => setCandidates(null)}>
                  Cerrar
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
