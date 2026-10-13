"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError(null);
    setEmailError(undefined);
    setPending(true);

    try {
      await apiRequest("/auth/forgot-password", { method: "POST", body: { email: String(form.get("email") ?? "") } });
      setDone(true);
    } catch (caught) {
      setEmailError(fieldErrorMessages(caught, { email: "Ingresa un correo válido." }).email);
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
          <p className="font-medium">Revisa tu correo institucional.</p>
          <p className="mt-1">
            Si existe una cuenta activa con ese correo, te enviamos un enlace para elegir una contraseña nueva. Vence
            en 30 minutos y sirve una sola vez. Revisa también la carpeta de spam.
          </p>
        </Alert>
        <p className="text-sm text-hub-muted">
          <Link href="/ingresar" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Volver a ingresar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}
      <FormField
        label="Correo institucional"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="nombre@uniguajira.edu.co"
        required
        maxLength={254}
        error={emailError}
      />
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Enviando…">
        Enviar enlace
      </Button>
    </form>
  );
}
