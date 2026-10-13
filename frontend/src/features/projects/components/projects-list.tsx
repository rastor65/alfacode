"use client";

import { FolderPlus, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";

import {
  METHODOLOGY_LABELS,
  PROJECT_ROLE_LABELS,
  PROJECT_STATUS_LABELS,
  type ProjectDetail,
  type ProjectSummary,
} from "../types";
import { ProjectDetailContent } from "./project-detail";
import { ProjectForm } from "./project-form";

/** Boton "Nuevo proyecto" con su modal (solo autoridades). */
export function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="neutral" onClick={() => setOpen(true)} className="min-h-10" aria-haspopup="dialog">
        <FolderPlus size={16} className="mr-2" aria-hidden="true" />
        Nuevo proyecto
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proyecto" size="lg">
        {open && (
          <ProjectForm
            onCancel={() => setOpen(false)}
            onSaved={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}

export function ProjectsList({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProjectSummary | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  // Evita que una respuesta tardia pise el detalle de otro proyecto abierto despues.
  const currentId = useRef<string | null>(null);

  /** Se pide al abrir (evento) y tras cada accion, para mostrar siempre el estado real. */
  async function loadDetail(id: string) {
    try {
      const project = await apiRequest<ProjectDetail>(`/projects/${id}`);
      if (currentId.current === id) {
        setDetail(project);
        setDetailError(null);
      }
    } catch (caught) {
      if (currentId.current === id) {
        setDetailError(describeError(caught));
      }
    }
  }

  function open(project: ProjectSummary) {
    currentId.current = project.id;
    setSelected(project);
    setDetail(null);
    setDetailError(null);
    void loadDetail(project.id);
  }

  function close() {
    currentId.current = null;
    setSelected(null);
  }

  return (
    <>
      <ul className="mt-3 divide-y divide-hub-border rounded-xl border border-hub-border">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => open(project)}
              aria-haspopup="dialog"
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-hub-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-hub-text">{project.name}</p>
                <p className="truncate text-sm text-hub-muted">
                  {project.leaders.length > 0
                    ? `Líder: ${project.leaders.map((leader) => leader.fullName).join(", ")}`
                    : "Sin líder asignado"}
                  {" · "}
                  {project.memberCount === 1 ? "1 integrante" : `${project.memberCount} integrantes`}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge>
                <Badge>{METHODOLOGY_LABELS[project.methodology]}</Badge>
                {project.myRole && <Badge>{PROJECT_ROLE_LABELS[project.myRole]}</Badge>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={selected !== null} onClose={close} title={detail?.name ?? selected?.name ?? "Proyecto"} size="lg">
        {selected &&
          (detailError && !detail ? (
            <Alert tone="error">{detailError}</Alert>
          ) : !detail ? (
            <p className="flex items-center gap-2 text-sm text-hub-muted" role="status">
              <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Cargando…
            </p>
          ) : detailError ? (
            // Tras un cambio que retira el acceso (p. ej. un lider que se retira a si mismo).
            <Alert tone="error">{detailError}</Alert>
          ) : (
            <ProjectDetailContent
              key={detail.id}
              project={detail}
              onChanged={() => {
                void loadDetail(selected.id);
                // La lista (servidor) refleja estado, lideres y conteo actualizados.
                router.refresh();
              }}
            />
          ))}
      </Modal>
    </>
  );
}
