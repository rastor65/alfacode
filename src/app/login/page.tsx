import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = {
  title: "Iniciar sesion",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="node-grid flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-950/85 p-6 shadow-2xl backdrop-blur">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
            AlfaCode
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Iniciar sesion
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Accede a la plataforma interna para gestionar proyectos,
            investigacion y contenidos institucionales.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
