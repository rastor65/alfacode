import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { CHANGE_PASSWORD_PATH } from "@/lib/auth/redirects";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Cambiar contraseña",
  robots: { index: false },
};

export default async function ChangePasswordPage() {
  const user = await requireSessionUser(CHANGE_PASSWORD_PATH, { allowPendingPasswordChange: true });

  return (
    <AuthShell
      title={user.mustChangePassword ? "Elige tu contraseña" : "Cambiar contraseña"}
      description={
        user.mustChangePassword
          ? `Hola, ${user.fullName}. Estás usando una contraseña temporal: elige una propia para continuar.`
          : "Al cambiarla se cerrarán tus otras sesiones abiertas."
      }
      footer={<LogoutButton className="mx-auto max-w-48" />}
    >
      <ChangePasswordForm temporary={user.mustChangePassword} />
    </AuthShell>
  );
}
