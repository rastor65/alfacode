import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PersonalPanelView } from "@/features/tracking/personal-panel";
import type { PersonalPanel } from "@/features/tracking/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isAuthority, roleLabel } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false },
};

async function loadPanel(): Promise<PersonalPanel | null> {
  // Solo errores de la API: la redireccion por sesion vencida debe propagarse.
  try {
    return await serverApi<PersonalPanel>("/tracking/me", "/hub");
  } catch (caught) {
    if (caught instanceof ApiRequestError || caught instanceof TypeError) return null;
    throw caught;
  }
}

export default async function PanelPage() {
  const user = await requireSessionUser("/hub");
  const panel = await loadPanel();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-sm font-medium text-hub-accent">Panel</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-hub-text text-balance sm:text-3xl">
        Hola, {user.fullName}
      </h1>

      {isAuthority(user.roles) && (
        <p className="mt-4 text-sm">
          <Link href="/hub/seguimiento" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Ver el panel institucional
          </Link>
        </p>
      )}

      <div className="mt-6">
        {panel ? <PersonalPanelView data={panel} /> : <Alert tone="error">No se pudieron cargar tus indicadores. Recarga la página en unos minutos.</Alert>}
      </div>

      <section
        className="mt-10 rounded-2xl border border-hub-border bg-hub-subtle p-5 sm:p-6"
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
        <p className="mt-4 text-sm text-hub-muted">
          Puedes editar tu nombre y cambiar tu contraseña en{" "}
          <Link href="/hub/perfil" className="font-medium text-hub-accent underline-offset-4 hover:underline">
            Mi perfil
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
