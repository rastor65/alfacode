import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ProfileActions } from "@/features/profile/components/profile-actions";
import { serverApi } from "@/lib/api/server";
import { type SessionUser, roleLabel } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false },
};

type Profile = SessionUser & { emailVerified: boolean; createdAt: string };

const STATUS_LABELS: Record<Profile["accountStatus"], string> = {
  active: "Activa",
  inactive: "Inactiva",
  pending: "Pendiente",
  rejected: "Rechazada",
};

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-hub-border pt-8 first:border-t-0 first:pt-0">
      <h2 id={id} className="text-base font-semibold text-hub-text">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-hub-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ProfilePage() {
  await requireSessionUser("/hub/perfil");
  const profile = await serverApi<Profile>("/users/me", "/hub/perfil");

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Mi perfil</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text text-balance sm:text-3xl">{profile.fullName}</h1>

      <div className="mt-8 space-y-8">
        <Section id="datos" title="Datos de la cuenta" description="Tu rol y el estado de la cuenta los administra la coordinación.">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Correo institucional</dt>
              <dd className="mt-1 break-all text-sm text-hub-text">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Roles</dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {profile.roles.map((role) => (
                  <Badge key={role}>{roleLabel(role)}</Badge>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Estado</dt>
              <dd className="mt-1 text-sm text-hub-text">{STATUS_LABELS[profile.accountStatus]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Miembro desde</dt>
              <dd className="mt-1 text-sm text-hub-text">{formatDate(profile.createdAt)}</dd>
            </div>
          </dl>
        </Section>

        <Section id="acciones" title="Tu cuenta" description="Puedes cambiar tu nombre y tu contraseña.">
          <ProfileActions fullName={profile.fullName} />
        </Section>
      </div>
    </div>
  );
}
