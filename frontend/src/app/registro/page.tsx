import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { DEFAULT_AFTER_LOGIN } from "@/lib/auth/redirects";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Solicitar acceso",
  robots: { index: false },
};

export default async function RegisterPage() {
  if (await getSessionUser()) {
    redirect(DEFAULT_AFTER_LOGIN);
  }

  return (
    <AuthShell
      layout="centered"
      title="Postulación al Semillero"
      badge="Hoja de Vida de Estudiantes"
      description="Completa tu resumen de hoja de vida institucional para postularte al semillero AlfaCode."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Ingresar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
