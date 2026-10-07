import { getSql } from "@/lib/db/client";

export type DashboardSummary = {
  activeProjects: number;
  researchLines: number;
  technologies: number;
  publications: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const sql = getSql();
  const [summary] = (await sql`
    select
      (select count(*)::int from projects where status <> 'ARCHIVED') as active_projects,
      (select count(*)::int from research_lines) as research_lines,
      (select count(*)::int from technologies) as technologies,
      (select count(*)::int from publications) as publications
  `) as unknown as Array<{
    active_projects: number;
    research_lines: number;
    technologies: number;
    publications: number;
  }>;

  return {
    activeProjects: Number(summary.active_projects),
    researchLines: Number(summary.research_lines),
    technologies: Number(summary.technologies),
    publications: Number(summary.publications),
  };
}
