"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, invalidFields } from "@/lib/api/errors";
import { CHANGE_PASSWORD_PATH } from "@/lib/auth/redirects";
import type { SessionUser } from "@/lib/auth/roles";

type LoginFormProps = {
  /** Destino ya validado con `safeNextPath`. */
  next: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const { user } = await apiRequest<{ user: SessionUser }>("/auth/login", {
        method: "POST",
        body: { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") },
      });
      // La cookie de sesion ya quedo fijada por el backend; se renderiza el destino con ella.
      // Con contrasena temporal, lo primero es cambiarla.
      router.replace(user.mustChangePassword ? CHANGE_PASSWORD_PATH : next);
      router.refresh();
    } catch (caught) {
      const fields = invalidFields(caught);
      setFieldErrors({
        email: fields.includes("email") ? "Ingresa un correo válido." : undefined,
        password: fields.includes("password") ? "Ingresa tu contraseña." : undefined,
      });
      setError(describeError(caught));
      setPending(false);
    }
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
        hint="Usa tu correo @uniguajira.edu.co."
        error={fieldErrors.email}
      />
      <FormField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
        error={fieldErrors.password}
      />
      <p className="-mt-2 text-right text-sm">
        <Link href="/recuperar-contrasena" className="text-hub-accent underline-offset-4 hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Ingresando…">
        Ingresar
      </Button>
    </form>
  );
}
