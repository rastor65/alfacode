import { InternalResourcePage } from "@/components/layout/internal-resource-page";
import type { ResearchLine } from "@/types/domain";

type InternalResearchPageProps = {
  researchLines: ResearchLine[];
};

export function InternalResearchPage({ researchLines }: InternalResearchPageProps) {
  return (
    <InternalResourcePage
      eyebrow="Gestion"
      title="Investigacion"
      description="Lineas de investigacion disponibles para clasificar proyectos, publicaciones y resultados academicos."
    >
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {researchLines.map((line) => (
          <article
            key={line.id}
            className="rounded-xl border border-[#d5e6ea] bg-white p-5 shadow-[0_2px_8px_rgba(8,21,27,0.05)]"
          >
            <h2 className="font-semibold text-[#10242c]">{line.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d7179]">
              {line.description}
            </p>
          </article>
        ))}
      </div>
    </InternalResourcePage>
  );
}
