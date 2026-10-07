import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types/domain";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group relative rounded-lg border border-white/10 bg-white/[0.045] p-5 transition hover:border-[#469eb4]/60 hover:bg-white/[0.07]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#7ed4e8]">
            {project.status}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">
            <Link href={`/proyectos/${project.slug}`} className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              {project.name}
            </Link>
          </h3>
        </div>
        <ArrowUpRight
          className="mt-1 shrink-0 text-cyan-100/50 transition group-hover:text-[#e1feff]"
          size={20}
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{project.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.technologies.slice(0, 4).map((technology) => (
          <Badge key={technology.id}>{technology.name}</Badge>
        ))}
      </div>
    </article>
  );
}
