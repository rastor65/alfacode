import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginPageCard } from "@/features/auth/components/login-page-card";
import { authOptions } from "@/lib/auth/options";

export const metadata: Metadata = {
  title: "Iniciar sesion",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/app/dashboard");
  }

  return <LoginPageCard />;
}
