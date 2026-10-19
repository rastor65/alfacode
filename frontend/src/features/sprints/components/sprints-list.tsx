"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCalendarDate } from "@/features/projects/types";
import { ProgressSummary } from "@/features/tasks/components/progress-summary";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import { SPRINT_STATUS_LABELS, type SprintDetail, type SprintSummary } from "../types";
import { SprintDetailContent } from "./sprint-detail";
import { SprintForm } from "./sprint-form";

type SprintsListProps = {
  projectId: string;
  sprints: SprintSummary[];
  canCreate: boolean;
};

/** Lista de sprints de un proyecto agil; alta y detalle en modales (F2-20). */
export function SprintsList({ projectId, sprints, canCreate }: SprintsListProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<SprintSummary | null>(null);
  const [detail, setDetail] = useState<SprintDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Evita que una respuesta tardia pise el detalle de otro sprint abierto despues.
  const currentId = useRef<string | null>(null);

  async function open(sprint: SprintSummary) {
    currentId.current = sprint.id;
    setSelected(sprint);
    setDetail(null);
    setDetailError(null);

    try {
      const loaded = await apiRequest<SprintDetail>(`/projects/${projectId}/sprints/${sprint.id}`);
      if (currentId.current === sprint.id) setDetail(loaded);
    } catch (caught) {
      if (currentId.current === sprint.id) setDetailError(describeError(caught));
    }
  }

  function close() {
    currentId.current = null;
    setSelected(null);
  }

  return (
    <>
      {canCreate && (
        <Button variant="neutral" className="min-h-10" onClick={() => setCreating(true)} aria-haspopup="dialog">
          <Plus size={16} className="mr-2" aria-hidden="true" />
          Nuevo sprint
        </Button>
      )}

      {sprints.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-hub-border px-4 py-10 text-center text-sm text-hub-muted">
          {canCreate ? "Aún no hay sprints. Crea el primero con «Nuevo sprint»." : "Aún no hay sprints en este proyecto."}
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-hub-border rounded-xl border border-hub-border">
          {sprints.map((sprint) => (
            <li key={sprint.id}>
              <button
                type="button"
                onClick={() => void open(sprint)}
                aria-haspopup="dialog"
                className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-hub-text">{sprint.name}</p>
                  <p className="truncate text-sm text-hub-muted">
                    {formatCalendarDate(sprint.startDate)} – {formatCalendarDate(sprint.endDate)}
                    {" · "}
                    <ProgressSummary progress={sprint.progress} variant="compact" />
                  </p>
                </div>
                <Badge>{SPRINT_STATUS_LABELS[sprint.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo sprint">
        {creating && (
          <SprintForm
            projectId={projectId}
            onCancel={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              router.refresh();
            }}
          />
        )}
      </Modal>

      <Modal open={selected !== null} onClose={close} title={detail?.name ?? selected?.name ?? "Sprint"} size="lg">
        {selected &&
          (detailError ? (
            <Alert tone="error">{detailError}</Alert>
          ) : !detail ? (
            <p className="flex items-center gap-2 text-sm text-hub-muted" role="status">
              <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Cargando…
            </p>
          ) : (
            <SprintDetailContent
              key={detail.id}
              projectId={projectId}
              sprint={detail}
              onChanged={(updated) => {
                setDetail(updated);
                // La lista (servidor) refleja estado y progreso actualizados.
                router.refresh();
              }}
            />
          ))}
      </Modal>
    </>
  );
}
