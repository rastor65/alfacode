import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      description="Te enviaremos a tu correo institucional un enlace para elegir una contraseña nueva. También sirve si tu contraseña temporal venció."
      footer={
        <>
          ¿La recordaste?{" "}
          <Link href="/ingresar" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Ingresar
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
