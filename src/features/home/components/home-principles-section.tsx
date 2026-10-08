import { homePrinciples } from "@/features/home/data/home-content";

export function HomePrinciplesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7ed4e8]">
          Modelo institucional
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          Una plataforma para investigar, construir y publicar.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {homePrinciples.map((principle) => (
          <div
            key={principle.title}
            className="glass-panel rounded-lg p-5 transition duration-300 hover:-translate-y-1"
          >
            <principle.icon
              className="text-[#7ed4e8]"
              size={24}
              aria-hidden="true"
            />
            <h2 className="mt-5 text-lg font-semibold text-white">
              {principle.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {principle.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
