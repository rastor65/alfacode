"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

import { SprintForm } from "./sprint-form";

/** Alta de sprint desde el encabezado de la vista; refresca los datos del servidor al guardar. */
export function NewSprintButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-semibold text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg"
      >
        <Plus aria-hidden="true" className="size-4" />Nuevo sprint
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo sprint">
        {open && (
          <SprintForm
            projectId={projectId}
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
