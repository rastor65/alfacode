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
      title="Solicitar acceso"
      description="Envía tu solicitud con tu correo institucional. Si la coordinación del semillero la aprueba, recibirás en ese correo una contraseña temporal para ingresar."
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
