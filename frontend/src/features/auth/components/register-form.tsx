"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

type Field = "fullName" | "email" | "message";

const FIELD_MESSAGES = {
  fullName: "Escribe tu nombre completo (entre 2 y 160 caracteres).",
  email: "Ingresa un correo válido.",
  message: "El mensaje admite hasta 1000 caracteres.",
};

/** Solicitud de vinculacion sin contrasena: se genera una temporal si la aprueban (DEC-016). */
export function RegisterForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError(null);
    setFieldErrors({});
    setPending(true);

    try {
      const message = String(form.get("message") ?? "").trim();
      await apiRequest("/auth/register", {
        method: "POST",
        body: {
          fullName: String(form.get("fullName") ?? ""),
          email: String(form.get("email") ?? ""),
          ...(message ? { message } : {}),
        },
      });
      setDone(true);
    } catch (caught) {
      setFieldErrors(fieldErrorMessages(caught, FIELD_MESSAGES));
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    // Mismo mensaje exista o no la cuenta: el backend no revela correos registrados.
    return (
      <div className="space-y-6">
        <Alert tone="success">
          <p className="font-medium">Recibimos tu solicitud.</p>
          <p className="mt-1">
            La coordinación del semillero la revisará. Si la aprueba, recibirás en tu correo institucional una
            contraseña temporal para ingresar; al hacerlo, el sistema te pedirá cambiarla.
          </p>
        </Alert>
        <p className="text-sm text-hub-muted">
          ¿Ya recibiste tu contraseña?{" "}
          <Link href="/ingresar" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
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
        label="Correo institucional"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="nombre@uniguajira.edu.co"
        required
        maxLength={254}
        hint="Solo se admiten correos @uniguajira.edu.co. Ahí llegará tu contraseña si te aprueban."
        error={fieldErrors.email}
      />
      <TextAreaField
        label="¿Por qué quieres unirte? (opcional)"
        name="message"
        maxLength={1000}
        rows={3}
        hint="Lo verá quien revise tu solicitud."
        error={fieldErrors.message}
      />
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Enviando solicitud…">
        Enviar solicitud
      </Button>
    </form>
  );
}
