import { researchLines } from "@/features/projects/data/project-seed";

export default function InternalResearchPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-white">Investigacion</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {researchLines.map((line) => (
          <article key={line.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-semibold text-white">{line.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{line.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
