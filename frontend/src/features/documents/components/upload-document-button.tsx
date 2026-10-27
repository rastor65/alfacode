"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";

import type { UploadLimits } from "../types";
import { DocumentForm } from "./document-form";
import { primaryButton } from "./document-ui";

/** Carga de un documento institucional (solo la coordinacion; el backend vuelve a comprobarlo). */
export function UploadDocumentButton({ limits }: { limits: UploadLimits }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={primaryButton}>
        <Upload aria-hidden="true" className="size-4" />
        Subir documento institucional
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Subir documento" size="lg">
        {open && (
          <DocumentForm
            scope="institutional"
            limits={limits}
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
