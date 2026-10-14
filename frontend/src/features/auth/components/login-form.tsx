"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
      {error && <Alert tone="error">{error}</Alert>}
      <FormField
        label="Correo institucional"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="nombre@uniguajira.edu.co"
        icon={<Mail size={16} aria-hidden="true" />}
        required
        maxLength={254}
        error={fieldErrors.email}
      />
      <FormField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        icon={<Lock size={16} aria-hidden="true" />}
        required
        maxLength={256}
        error={fieldErrors.password}
      />
      <p className="-mt-1 text-right text-xs">
        <Link
          href="/recuperar-contrasena"
          className="text-cyan-300 underline-offset-4 transition hover:text-cyan-200 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <Button
        type="submit"
        className="w-full group relative overflow-hidden !text-[#ffffff] shadow-[0_0_25px_rgba(70,158,180,0.35)] hover:shadow-[0_0_35px_rgba(70,158,180,0.55)] transition-all font-semibold"
        style={{ color: "#ffffff" }}
        pending={pending}
        pendingLabel="Ingresando…"
      >
        <span className="flex items-center justify-center gap-2 text-[#ffffff]">
          <span className="text-[#ffffff]">Ingresar</span>
          <ArrowRight
            size={16}
            className="transition-transform duration-200 group-hover:translate-x-1 text-[#ffffff]"
            aria-hidden="true"
          />
        </span>
      </Button>
    </form>
  );
}
