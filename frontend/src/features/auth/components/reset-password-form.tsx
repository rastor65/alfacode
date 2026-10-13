"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { ApiRequestError, describeError, fieldErrorMessages } from "@/lib/api/errors";
import { clearFragment, useFragmentToken } from "@/lib/auth/fragment-token";

type Field = "password" | "confirmPassword";

export function ResetPasswordForm() {
  const token = useFragmentToken();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    setError(null);

    if (password !== String(form.get("confirmPassword") ?? "")) {
      setFieldErrors({ confirmPassword: "Las contraseñas no coinciden." });
      return;
    }

    setFieldErrors({});
    setPending(true);

    try {
      await apiRequest("/auth/reset-password", { method: "POST", body: { token, password } });
      clearFragment();
      setDone(true);
    } catch (caught) {
      if (caught instanceof ApiRequestError && caught.code === "INVALID_TOKEN") {
        clearFragment();
        setLinkError(describeError(caught));
      } else {
        setFieldErrors(
          fieldErrorMessages(caught, { password: "La contraseña debe tener entre 12 y 128 caracteres." }),
        );
        setError(describeError(caught));
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <Alert tone="success">
          <p className="font-medium">Tu contraseña quedó actualizada.</p>
          <p className="mt-1">Por seguridad cerramos todas tus sesiones abiertas. Ingresa con la contraseña nueva.</p>
        </Alert>
        <ButtonLink href="/ingresar" className="w-full">
          Ingresar
        </ButtonLink>
      </div>
    );
  }

  if (linkError || token === null) {
    return (
      <div className="space-y-6">
        <Alert tone="error">
          <p className="font-medium">{linkError ?? "El enlace está incompleto."}</p>
          <p className="mt-1">Los enlaces de recuperación vencen en 30 minutos y sirven una sola vez.</p>
        </Alert>
        <ButtonLink href="/recuperar-contrasena" variant="neutral" className="w-full">
          Pedir un enlace nuevo
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <FormField
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        maxLength={128}
        hint="Entre 12 y 128 caracteres. Puedes usar una frase."
        error={fieldErrors.password}
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
      <Button
        type="submit"
        className="w-full"
        disabled={token === undefined}
        pending={pending}
        pendingLabel="Guardando…"
      >
        Guardar contraseña
      </Button>
    </form>
  );
}
