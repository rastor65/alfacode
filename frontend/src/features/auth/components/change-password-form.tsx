"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { ApiRequestError, describeError, fieldErrorMessages } from "@/lib/api/errors";
import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/redirects";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const FIELD_MESSAGES = {
  currentPassword: "Ingresa tu contraseña actual.",
  newPassword: "La contraseña debe tener entre 12 y 128 caracteres.",
};

type ChangePasswordFormProps = {
  /** La contrasena actual es la temporal recibida por correo. */
  temporary: boolean;
};

export function ChangePasswordForm({ temporary }: ChangePasswordFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");

    setError(null);

    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setFieldErrors({ confirmPassword: "Las contraseñas no coinciden." });
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      await apiRequest("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      // Las demas sesiones se cerraron; esta sigue abierta y ya puede usar el HUB.
      router.replace(DEFAULT_AFTER_LOGIN);
      router.refresh();
    } catch (caught) {
      const errors = fieldErrorMessages(caught, FIELD_MESSAGES);

      if (caught instanceof ApiRequestError && caught.code === "INVALID_CURRENT_PASSWORD") {
        errors.currentPassword = describeError(caught);
      } else if (caught instanceof ApiRequestError && caught.code === "PASSWORD_UNCHANGED") {
        errors.newPassword = describeError(caught);
      }

      setFieldErrors(errors);
      setError(describeError(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <FormField
        label={temporary ? "Contraseña temporal" : "Contraseña actual"}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
        hint={temporary ? "La que recibiste en tu correo institucional." : undefined}
        error={fieldErrors.currentPassword}
      />
      <FormField
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={128}
        hint="Entre 12 y 128 caracteres. Puedes usar una frase."
        error={fieldErrors.newPassword}
      />
      <FormField
        label="Confirma la nueva contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={128}
        error={fieldErrors.confirmPassword}
      />
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Guardando…">
        Guardar contraseña
      </Button>
    </form>
  );
}
