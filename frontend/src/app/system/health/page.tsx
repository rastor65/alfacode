type ApiHealth = {
  status: string;
  service: string;
  database: string;
  timestamp: string;
};

type HealthCheck =
  | {
      ok: true;
      data: ApiHealth;
    }
  | {
      ok: false;
      message: string;
    };

export const dynamic = "force-dynamic";

async function getHealth(): Promise<HealthCheck> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(new URL("/api/v1/health", appUrl), {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `La API respondio con HTTP ${response.status}.`,
      };
    }

    return {
      ok: true,
      data: (await response.json()) as ApiHealth,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "No se pudo consultar el backend.",
    };
  }
}

export default async function SystemHealthPage() {
  const health = await getHealth();

  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded border border-cyan-200/15 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-cyan-200/70">
              AlfaCode HUB
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Estado tecnico
            </h1>
          </div>
          <span
            className={`rounded px-3 py-1 text-sm font-medium ${
              health.ok
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-rose-400/15 text-rose-200"
            }`}
          >
            {health.ok ? "Disponible" : "Sin conexion"}
          </span>
        </div>

        {health.ok ? (
          <dl className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded border border-white/10 bg-white/5 p-4">
              <dt className="text-slate-400">Servicio</dt>
              <dd className="mt-1 font-mono">{health.data.service}</dd>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4">
              <dt className="text-slate-400">Base de datos</dt>
              <dd className="mt-1 font-mono">{health.data.database}</dd>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4">
              <dt className="text-slate-400">Estado</dt>
              <dd className="mt-1 font-mono">{health.data.status}</dd>
            </div>
            <div className="rounded border border-white/10 bg-white/5 p-4">
              <dt className="text-slate-400">Fecha</dt>
              <dd className="mt-1 font-mono">{health.data.timestamp}</dd>
            </div>
          </dl>
        ) : (
          <p className="rounded border border-rose-200/20 bg-rose-950/30 p-4 text-sm text-rose-100">
            {health.message}
          </p>
        )}
      </section>
    </main>
  );
}
