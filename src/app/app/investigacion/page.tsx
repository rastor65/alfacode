import { getAllResearchLinesForAdmin } from "@/features/research/services/research-repository";

export const dynamic = "force-dynamic";

export default async function InternalResearchPage() {
  const researchLines = await getAllResearchLinesForAdmin();

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#347f92]">
        Gestion
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[#10242c]">Investigacion</h1>
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
    </div>
  );
}
