import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Elegir contraseña nueva",
  robots: { index: false },
  // El token viaja en el fragmento, pero por si acaso no se envia la URL a otros sitios.
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Elige una contraseña nueva"
      description="Al guardarla se cerrarán todas tus sesiones abiertas."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
