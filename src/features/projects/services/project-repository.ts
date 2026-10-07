import { getSql } from "@/lib/db/client";
import type { Project, ProjectStatus, ResearchLine, Technology, Visibility } from "@/types/domain";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  problem_statement: string | null;
  objective: string | null;
  solution: string | null;
  status: ProjectStatus;
  visibility: Visibility;
  technologies: Technology[];
  research_lines: ResearchLine[];
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary ?? "",
    problemStatement: row.problem_statement ?? "",
    objective: row.objective ?? "",
    solution: row.solution ?? "",
    status: row.status,
    visibility: row.visibility,
    technologies: row.technologies ?? [],
    researchLines: row.research_lines ?? [],
  };
}

const projectSelect = `
  select
    p.id::text,
    p.name,
    p.slug,
    p.summary,
    p.problem_statement,
    p.objective,
    p.solution,
    p.status,
    p.visibility,
    coalesce(
      jsonb_agg(distinct jsonb_build_object(
        'id', t.id::text,
        'name', t.name,
        'slug', t.slug,
        'category', coalesce(t.category, '')
      )) filter (where t.id is not null),
      '[]'::jsonb
    ) as technologies,
    coalesce(
      jsonb_agg(distinct jsonb_build_object(
        'id', rl.id::text,
        'name', rl.name,
        'slug', rl.slug,
        'description', coalesce(rl.description, '')
      )) filter (where rl.id is not null),
      '[]'::jsonb
    ) as research_lines
  from projects p
  left join project_technologies pt on pt.project_id = p.id
  left join technologies t on t.id = pt.technology_id
  left join project_research_lines prl on prl.project_id = p.id
  left join research_lines rl on rl.id = prl.research_line_id
`;

export async function getPublicProjects() {
  const sql = getSql();
  const rows = (await sql`
    ${sql.unsafe(projectSelect)}
    where p.visibility = 'PUBLIC'
    group by p.id
    order by p.published_at desc nulls last, p.created_at desc
  `) as unknown as ProjectRow[];

  return rows.map(mapProject);
}

export async function getAllProjectsForAdmin() {
  const sql = getSql();
  const rows = (await sql`
    ${sql.unsafe(projectSelect)}
    group by p.id
    order by p.created_at desc
  `) as unknown as ProjectRow[];

  return rows.map(mapProject);
}

export async function getPublicProjectBySlug(slug: string) {
  const sql = getSql();
  const rows = (await sql`
    ${sql.unsafe(projectSelect)}
    where p.slug = ${slug}
      and p.visibility = 'PUBLIC'
    group by p.id
    limit 1
  `) as unknown as ProjectRow[];

  const [project] = rows.map(mapProject);
  return project ?? null;
}

export async function getPublicProjectSlugs() {
  const sql = getSql();
  const rows = (await sql`
    select slug
    from projects
    where visibility = 'PUBLIC'
    order by published_at desc nulls last, created_at desc
  `) as unknown as Array<{ slug: string }>;

  return rows.map((row) => row.slug);
}
