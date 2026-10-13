"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { ApiRequestError, describeError, fieldErrorMessages } from "@/lib/api/errors";
import { clearFragment, useFragmentToken } from "@/lib/auth/fragment-token";

type Field = "fullName" | "password" | "confirmPassword";

const FIELD_MESSAGES = {
  fullName: "Escribe tu nombre completo (entre 2 y 160 caracteres).",
  password: "La contraseña debe tener entre 12 y 128 caracteres.",
};

/** Errores que invalidan el enlace: ya no tiene sentido mostrar el formulario. */
const LINK_ERRORS = ["INVALID_TOKEN", "EMAIL_ALREADY_REGISTERED", "EMAIL_DOMAIN_NOT_ALLOWED"];

export function AcceptInvitationForm() {
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
      await apiRequest("/invitations/accept", {
        method: "POST",
        body: { token, fullName: String(form.get("fullName") ?? ""), password },
      });
      clearFragment();
      setDone(true);
    } catch (caught) {
      if (caught instanceof ApiRequestError && LINK_ERRORS.includes(caught.code)) {
        clearFragment();
        setLinkError(describeError(caught));
      } else {
        setFieldErrors(fieldErrorMessages(caught, FIELD_MESSAGES));
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
          <p className="font-medium">Tu cuenta está lista.</p>
          <p className="mt-1">Ya puedes ingresar con tu correo institucional y la contraseña que elegiste.</p>
        </Alert>
        <ButtonLink href="/ingresar" className="w-full">
          Ingresar
        </ButtonLink>
      </div>
    );
  }

  if (linkError || token === null) {
    return (
      <Alert tone="error">
        <p className="font-medium">{linkError ?? "El enlace está incompleto."}</p>
        <p className="mt-1">
          Las invitaciones sirven una sola vez y vencen a las 72 horas. Pide una nueva a la coordinación del
          semillero.
        </p>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <FormField
        label="Nombre completo"
        name="fullName"
        autoComplete="name"
        required
        minLength={2}
        maxLength={160}
        error={fieldErrors.fullName}
      />
      <FormField
        label="Contraseña"
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
        label="Confirma la contraseña"
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
        pendingLabel="Creando cuenta…"
      >
        Crear mi cuenta
      </Button>
    </form>
  );
}
