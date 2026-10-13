"use client";

import { KeyRound, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";

import { ProfileNameForm } from "./profile-name-form";

/** Acciones del perfil propio; cada una se abre en un modal. */
export function ProfileActions({ fullName }: { fullName: string }) {
  const [dialog, setDialog] = useState<"name" | "password" | null>(null);
  const close = () => setDialog(null);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="neutral" className="min-h-10" onClick={() => setDialog("name")}>
          <Pencil size={15} className="mr-2" aria-hidden="true" />
          Editar nombre
        </Button>
        <Button variant="neutral" className="min-h-10" onClick={() => setDialog("password")}>
          <KeyRound size={15} className="mr-2" aria-hidden="true" />
          Cambiar contraseña
        </Button>
      </div>

      <Modal open={dialog === "name"} onClose={close} title="Editar nombre">
        <ProfileNameForm fullName={fullName} onSaved={close} />
      </Modal>

      <Modal
        open={dialog === "password"}
        onClose={close}
        title="Cambiar contraseña"
        description="Al cambiarla se cerrarán tus otras sesiones abiertas."
      >
        <ChangePasswordForm temporary={false} afterSuccess="inline" />
      </Modal>
    </>
  );
}
