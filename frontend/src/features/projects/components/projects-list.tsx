"use client";

import { PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

import { ProjectForm } from "./project-form";

/** Boton "Nuevo proyecto" con su modal (solo autoridades). */
export function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-hub-accent px-3 text-sm font-medium text-hub-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hub-accent focus-visible:ring-offset-2 focus-visible:ring-offset-hub-bg"
      >
        <PlusCircle aria-hidden="true" className="size-4" />
        Nuevo proyecto
      </button>
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
