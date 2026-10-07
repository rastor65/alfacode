import { PublicHeader } from "@/components/layout/public-header";
import { researchLines } from "@/features/projects/data/project-seed";

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#05080d]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
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
      </main>
    </div>
  );
}
