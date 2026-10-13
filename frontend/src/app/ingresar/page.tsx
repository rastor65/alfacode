import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { CHANGE_PASSWORD_PATH, safeNextPath } from "@/lib/auth/redirects";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const next = safeNextPath((await searchParams).next);

  // Con una sesion valida no tiene sentido mostrar el formulario.
  const user = await getSessionUser();

  if (user) {
    redirect(user.mustChangePassword ? CHANGE_PASSWORD_PATH : next);
  }

  return (
    <AuthShell
      title="Ingresar a AlfaCode HUB"
      description="Accede con tu cuenta institucional del semillero."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Solicitar acceso
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
