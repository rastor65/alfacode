import { getSql } from "@/lib/db/client";
import type { ResearchLine } from "@/types/domain";

type ResearchLineRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

function mapResearchLine(row: ResearchLineRow): ResearchLine {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
  };
}

export async function getPublicResearchLines() {
  const sql = getSql();
  const rows = (await sql`
    select id::text, name, slug, description
    from research_lines
    where visibility = 'PUBLIC'
      and status = 'ACTIVE'
    order by name
  `) as unknown as ResearchLineRow[];

  return rows.map(mapResearchLine);
}

export async function getAllResearchLinesForAdmin() {
  const sql = getSql();
  const rows = (await sql`
    select id::text, name, slug, description
    from research_lines
    order by name
  `) as unknown as ResearchLineRow[];

  return rows.map(mapResearchLine);
}
