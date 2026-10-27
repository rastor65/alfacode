"use client";

import { CirclePlus } from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import { primaryButton } from "@/features/documents/components/document-ui";

import { RequestForm } from "./request-form";

/** Abre el formulario de una nueva solicitud en un modal; al registrarla lleva a su detalle. */
export function NewRequestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={primaryButton}>
        <CirclePlus aria-hidden="true" className="size-4" />
        Nueva solicitud
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nueva solicitud" size="lg">
        <RequestForm onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
