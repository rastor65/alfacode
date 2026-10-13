import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { AcceptInvitationForm } from "@/features/auth/components/accept-invitation-form";

export const metadata: Metadata = {
  title: "Aceptar invitación",
  robots: { index: false },
  // El token viaja en el fragmento, pero por si acaso no se envia la URL a otros sitios.
  referrer: "no-referrer",
};

export default function InvitationPage() {
  return (
    <AuthShell
      title="Únete a AlfaCode HUB"
      description="Te invitaron al semillero. Completa tus datos para crear tu cuenta."
    >
      <AcceptInvitationForm />
    </AuthShell>
  );
}
