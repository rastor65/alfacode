"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

/** F1-12: el nombre es el unico dato que la persona edita; rol, estado y correo no. */
export function ProfileNameForm({ fullName, onSaved }: { fullName: string; onSaved?: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setSaved(false);
    setError(null);
    setFieldError(undefined);

    try {
      await apiRequest("/users/me", { method: "PATCH", body: { fullName: String(form.get("fullName") ?? "") } });
      // Actualiza el nombre en el header y en el resto de la vista.
      router.refresh();

      if (onSaved) {
        onSaved();
        return;
      }

      setSaved(true);
    } catch (caught) {
      setFieldError(fieldErrorMessages(caught, { fullName: "Escribe tu nombre completo (entre 2 y 160 caracteres)." }).fullName);
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {saved && <Alert tone="success">Nombre actualizado.</Alert>}
      <FormField
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        defaultValue={fullName}
        required
        minLength={2}
        maxLength={160}
        error={fieldError}
      />
      <Button type="submit" variant="neutral" pending={pending} pendingLabel="Guardando…">
        Guardar nombre
      </Button>
    </form>
  );
}
