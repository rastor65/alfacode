import { PublicPageShell } from "@/components/layout/public-page-shell";
import type { ResearchLine } from "@/types/domain";

type PublicResearchPageProps = {
  researchLines: ResearchLine[];
};

export function PublicResearchPage({ researchLines }: PublicResearchPageProps) {
  return (
    <PublicPageShell>
      <h1 className="text-4xl font-semibold text-white">
        Lineas de investigacion
      </h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {researchLines.map((line) => (
          <article
            key={line.id}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-6"
          >
            <h2 className="text-xl font-semibold text-white">{line.name}</h2>
            <p className="mt-3 text-slate-300">{line.description}</p>
          </article>
        ))}
      </div>
    </PublicPageShell>
  );
}
