import type { Metadata } from "next";

import { Alert } from "@/components/ui/alert";
import { OverviewPanelView } from "@/features/tracking/overview-panel";
import { PersonalPanelView } from "@/features/tracking/personal-panel";
import { plural, type InstitutionalPanel, type OverviewPanel, type PersonalPanel } from "@/features/tracking/types";
import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";
import { isAuthority, roleLabel } from "@/lib/auth/roles";
import { requireSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false },
};

async function load<T>(path: string): Promise<T | null> {
  // Solo errores de la API: la redireccion por sesion vencida debe propagarse.
  try {
    return await serverApi<T>(path, "/hub");
  } catch (caught) {
    if (caught instanceof ApiRequestError || caught instanceof TypeError) return null;
    throw caught;
  }
}

const loadError = <Alert tone="error">No se pudieron cargar los indicadores. Recarga la página en unos minutos.</Alert>;

/**
 * I-26 (DEC-049): autoridades ven el panel del semillero y debajo "Mi trabajo"; el resto, su panel
 * personal ampliado. El rol solo elige la vista: el backend vuelve a autorizar cada endpoint.
 */
export default async function PanelPage() {
  const user = await requireSessionUser("/hub");
  const authority = isAuthority(user.roles);
  const [panel, institutional, overview] = await Promise.all([
    load<PersonalPanel>("/tracking/me"),
    authority ? load<InstitutionalPanel>("/tracking/institutional") : null,
    authority ? load<OverviewPanel>("/tracking/overview") : null,
  ]);

  const authorityLabel = [user.roles.includes("admin") && "Administración", user.roles.includes("coordinator") && "Coordinación"].filter(Boolean).join(" y ");

  return (
    <div className="mx-auto w-full max-w-360">
      {authority ? (
        <>
          {institutional && overview ? <OverviewPanelView institutional={institutional} overview={overview} roleLabel={authorityLabel} /> : <><h1 className="text-2xl font-semibold text-hub-text">Panel general</h1><div className="mt-6">{loadError}</div></>}
          <details className="group mt-10 rounded-2xl border border-hub-border p-4 sm:p-5" open={Boolean(panel && panel.tasks.open > 0)}>
            <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-semibold text-hub-text">Mi trabajo</span>
              <span className="text-sm text-hub-muted">
                {panel ? `${plural(panel.tasks.open, "tarea abierta", "tareas abiertas")} · ${plural(panel.projects.total, "proyecto", "proyectos")}` : ""}
                <span aria-hidden="true" className="ml-2 inline-block transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <div className="mt-4">{panel ? <PersonalPanelView data={panel} /> : loadError}</div>
          </details>
        </>
      ) : (
        panel ? <PersonalPanelView data={panel} roleLabel={user.roles.map(roleLabel).join(" / ")} /> : <><h1 className="text-2xl font-semibold text-hub-text">Mi panel</h1><div className="mt-6">{loadError}</div></>
      )}
    </div>
  );
}
