import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative overflow-hidden rounded-lg border border-slate-900/10 bg-white p-5 shadow-[0_22px_80px_rgba(8,32,43,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#469eb4]/40 hover:shadow-[0_28px_90px_rgba(70,158,180,0.18)]">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#469eb4] to-transparent opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-[#469eb4]/10 blur-3xl transition group-hover:bg-[#469eb4]/20"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#287f92]">
            {project.status}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[#071822]">
            <Link href={`/proyectos/${project.slug}`} className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              {project.name}
            </Link>
          </h3>
        </div>
        <ArrowUpRight
          className="mt-1 shrink-0 text-[#469eb4] transition group-hover:translate-x-1 group-hover:-translate-y-1"
          size={20}
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{project.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.technologies.slice(0, 4).map((technology) => (
          <Badge
            key={technology.id}
            className="border-[#469eb4]/15 bg-[#469eb4]/10 text-[#0b4552]"
          >
            {technology.name}
          </Badge>
        ))}
      </div>
    </article>
  );
}
