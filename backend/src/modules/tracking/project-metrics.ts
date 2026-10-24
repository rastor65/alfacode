import { type EntityManager, In } from "typeorm";
import { Sprint } from "../sprints/sprint.entity";
import { Task } from "../tasks/task.entity";
import { ProjectObservation } from "./project-observation.entity";

// Calculos por proyecto compartidos por los paneles de /hub y por la lista de /hub/proyectos (I-26/I-27).
export const DAY = 86_400_000;
const count = (value: unknown) => Number(value ?? 0);
/** Dia calendario de America/Bogota (UTC-5 fijo, sin horario de verano). */
export function bogotaDay(now: Date, plusDays = 0) {
  return new Date(now.getTime() - 5 * 3_600_000 + plusDays * DAY).toISOString().slice(0, 10);
}
/** Porcentaje solo con denominador; sin datos la UI muestra "Sin tareas", nunca 0 % ni 100 %. */
export const percent = (done: number, total: number) => (total > 0 ? Math.round((done * 100) / total) : null);


/** Instante de una fecha leida en crudo: SQLite devuelve "YYYY-MM-DD HH:MM:SS" en UTC; PostgreSQL, Date. */
export function instant(value: unknown) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const text = String(value);
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(text) ? text : `${text.replace(" ", "T")}Z`);
}
/** G-02: porcentaje del periodo planificado ya transcurrido, acotado a 0..100; sin fechas validas, null. */
export function elapsed(start: string | null, end: string | null, today: string) {
  if (!start || !end) return null;
  const at = (day: string) => Date.parse(`${day}T00:00:00Z`), span = at(end) - at(start);
  return span > 0 ? Math.min(100, Math.max(0, Math.round(((at(today) - at(start)) * 100) / span))) : null;
}
export const RISK_INACTIVE_DAYS = 14, RISK_BEHIND_POINTS = 25;
export type RiskCode = "overdue_tasks" | "past_end_date" | "inactive" | "behind_schedule";
/** G-04: alertas operativas de un proyecto activo; no evaluan al equipo. */
export function risks(p: { status: string; endDate: string | null; overdue: number; progress: number | null; elapsed: number | null; lastActivityAt: Date | null }, today: string, cutoff: Date) {
  if (p.status !== "active") return [];
  const found: RiskCode[] = [];
  if (p.overdue > 0) found.push("overdue_tasks");
  if (p.endDate && p.endDate < today) found.push("past_end_date");
  if (!p.lastActivityAt || p.lastActivityAt.getTime() < cutoff.getTime() - RISK_INACTIVE_DAYS * DAY) found.push("inactive");
  if (p.progress !== null && p.elapsed !== null && p.elapsed - p.progress >= RISK_BEHIND_POINTS) found.push("behind_schedule");
  return found;
}

type Progress = { total: number; done: number; progress: number | null };
export type ProjectCard = {
  tasks: Progress; overdue: number; unassigned: number; myOpen: number;
  sprint: { id: string; name: string; endDate: string; tasks: Progress } | null;
};

/** M-09/G-01: avance actual de cada proyecto, vencidas, sin responsable, mis abiertas (si hay `me`) y sprint activo. */
export async function projectCards(m: EntityManager, ids: string[], today: string, me?: string) {
  if (!ids.length) return new Map<string, ProjectCard>();
  const [counts, sprints] = await Promise.all([
    m.createQueryBuilder(Task, "t").select("t.project_id", "projectId").addSelect("COUNT(*)", "total")
      .addSelect("SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)", "done")
      .addSelect("SUM(CASE WHEN t.status <> 'done' AND t.due_date < :today THEN 1 ELSE 0 END)", "overdue")
      .addSelect("SUM(CASE WHEN t.status <> 'done' AND t.assignee_id IS NULL THEN 1 ELSE 0 END)", "unassigned")
      .addSelect(me ? "SUM(CASE WHEN t.status <> 'done' AND t.assignee_id = :me THEN 1 ELSE 0 END)" : "0", "mine")
      .where("t.project_id IN (:...ids)", { ids }).setParameters(me ? { ids, today, me } : { ids, today }).groupBy("t.project_id").getRawMany(),
    m.find(Sprint, { where: { projectId: In(ids), status: "active" } }),
  ]);
  const sprintTasks = sprints.length ? await m.createQueryBuilder(Task, "t").select("t.sprint_id", "sprintId").addSelect("COUNT(*)", "total")
    .addSelect("SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END)", "done")
    .where("t.sprint_id IN (:...sprints)", { sprints: sprints.map(sp => sp.id) }).groupBy("t.sprint_id").getRawMany() : [];
  const bySprint = new Map(sprintTasks.map(row => [row.sprintId as string, row]));
  const sprintOf = new Map(sprints.map(sp => {
    const total = count(bySprint.get(sp.id)?.total), done = count(bySprint.get(sp.id)?.done);
    return [sp.projectId, { id: sp.id, name: sp.name, endDate: sp.endDate, tasks: { total, done, progress: percent(done, total) } }];
  }));
  const byProject = new Map(counts.map(row => [row.projectId as string, row]));
  return new Map(ids.map(id => {
    const row = byProject.get(id) ?? {}, total = count(row.total), done = count(row.done);
    return [id, { tasks: { total, done, progress: percent(done, total) }, overdue: count(row.overdue), unassigned: count(row.unassigned), myOpen: count(row.mine), sprint: sprintOf.get(id) ?? null }];
  }));
}

/** G-03 sin projects.updated_at: ultima tarea modificada u observacion registrada de cada proyecto. */
export async function projectActivity(m: EntityManager, ids: string[]) {
  const result = new Map<string, Date>();
  if (!ids.length) return result;
  const [tasks, notes] = await Promise.all([
    m.createQueryBuilder(Task, "t").select("t.project_id", "projectId").addSelect("MAX(t.updated_at)", "at").where("t.project_id IN (:...ids)", { ids }).groupBy("t.project_id").getRawMany(),
    m.createQueryBuilder(ProjectObservation, "o").select("o.project_id", "projectId").addSelect("MAX(o.created_at)", "at").where("o.project_id IN (:...ids)", { ids }).groupBy("o.project_id").getRawMany(),
  ]);
  for (const row of [...tasks, ...notes]) {
    const at = instant(row.at), prev = result.get(row.projectId);
    if (at && (!prev || at > prev)) result.set(row.projectId, at);
  }
  return result;
}

/**
 * G-01 a G-04 reunidos: tarjeta, tiempo transcurrido, ultima actividad y alertas de cada proyecto.
 * `updatedAt` acepta la fecha cruda de una consulta SQL o un Date de la entidad.
 */
export async function projectSignals(
  m: EntityManager, projects: { id: string; status: string; startDate: string | null; endDate: string | null; updatedAt: unknown }[], cutoff: Date, me?: string,
) {
  const today = bogotaDay(cutoff), ids = projects.map(project => project.id);
  const [cards, activity] = await Promise.all([projectCards(m, ids, today, me), projectActivity(m, ids)]);
  return new Map(projects.map(project => {
    const card = cards.get(project.id)!, updated = instant(project.updatedAt), other = activity.get(project.id) ?? null;
    const lastActivityAt = updated && other && other > updated ? other : (updated ?? other);
    const timeElapsed = elapsed(project.startDate, project.endDate, today);
    return [project.id, {
      ...card, elapsed: timeElapsed, lastActivityAt: lastActivityAt?.toISOString() ?? null,
      risks: risks({ status: project.status, endDate: project.endDate, overdue: card.overdue, progress: card.tasks.progress, elapsed: timeElapsed, lastActivityAt }, today, cutoff),
    }];
  }));
}
