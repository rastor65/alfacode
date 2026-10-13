import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false },
};

export default async function PanelPage() {
  const user = await requireSessionUser("/panel");

  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Panel</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text text-balance sm:text-3xl">
        Hola, {user.fullName}
      </h1>

      <section
        className="mt-8 rounded-2xl border border-hub-border bg-hub-subtle p-5 sm:p-6"
        aria-labelledby="account-title"
      >
        <h2 id="account-title" className="text-base font-semibold text-hub-text">
          Tu cuenta
        </h2>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Correo</dt>
            <dd className="mt-1 break-all text-sm text-hub-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-hub-muted">Roles</dt>
            <dd className="mt-1.5 flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role}>{roleLabel(role)}</Badge>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-6 text-sm text-hub-muted">
        Las herramientas de perfil, integrantes y solicitudes se habilitarán en las próximas iteraciones.
      </p>
    </div>
  );
}
