import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type ObjectLiteral, type SelectQueryBuilder } from "typeorm";
import { ApiError } from "../../common/api-error";
import { AcademicProduct, PRODUCT_STATUSES, PRODUCT_TYPES, ProductAuthor } from "../academic/academic.entities";
import { EVENT_STATUSES, EventParticipant, EventRecord } from "../events/event.entities";
import { actorRoles, type Actor } from "../projects/project-access";
import { PROJECT_STATUSES, Project } from "../projects/project.entity";
import { isCalendarDate, projectProgress } from "../projects/projects.service";
import { ProjectResearchLine, ResearchLine, ResearchResult } from "../research/research.entities";
import { isAuthority } from "../roles/role-policy";
import { Task } from "../tasks/task.entity";
import { grouped, percent } from "./tracking.service";
import type { EventReportQuery, ProductReportQuery, ProjectReportQuery } from "./tracking.dto";

// R-01 a R-03 de docs/catalogo-indicadores.md: filtros aplicados antes de contar; resumen = conjunto filtrado.
const forbidden = () => new ApiError(403, "TRACKING_FORBIDDEN", "Solo coordinacion y administracion consultan los reportes");
const invalid = (message: string) => new ApiError(400, "REPORT_INVALID", message);
const lineOf = (column: string) => `EXISTS (SELECT 1 FROM project_research_lines prl WHERE prl.project_id = ${column} AND prl.research_line_id = :line)`;
/** Inicio del dia calendario de Bogota en UTC (UTC-5 fijo). */
const bogotaStart = (day: string, plus = 0) => { const d = new Date(`${day}T00:00:00-05:00`); d.setUTCDate(d.getUTCDate() + plus); return d.toISOString(); };
/** Subconsulta de ids del conjunto filtrado, para agregar sobre el mismo conjunto. */
const idsOf = (qb: SelectQueryBuilder<ObjectLiteral>, column: string) => qb.clone().select(column).orderBy();
/** Conteo por clave para las filas de la pagina visible. */
const countBy = async (qb: SelectQueryBuilder<ObjectLiteral>, key: string, ids: string[]) => {
  if (!ids.length) return new Map<string, number>();
  const rows: { id: string; n: string | number }[] = await qb.select(key, "id").addSelect("COUNT(*)", "n").andWhere(`${key} IN (:...ids)`, { ids }).groupBy(key).getRawMany();
  return new Map(rows.map(r => [r.id, Number(r.n)]));
};

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  private guard(actor: Actor, q: { from?: string; to?: string }) {
    if (!isAuthority(actorRoles(actor))) throw forbidden();
    for (const day of [q.from, q.to]) if (day && !isCalendarDate(day)) throw invalid("La fecha del filtro no es valida");
    if (q.from && q.to && q.from > q.to) throw invalid("La fecha inicial no puede ser posterior a la final");
  }

  async projects(actor: Actor, q: ProjectReportQuery) {
    this.guard(actor, q);
    const m = this.db.manager, b = m.createQueryBuilder(Project, "p");
    if (q.type) b.andWhere("p.type = :type", { type: q.type });
    if (q.status) b.andWhere("p.status = :status", { status: q.status });
    if (q.researchLineId) b.andWhere(lineOf("p.id"), { line: q.researchLineId });
    if (q.from || q.to) {
      b.andWhere("p.start_date IS NOT NULL");
      if (q.to) b.andWhere("p.start_date <= :to", { to: q.to });
      if (q.from) b.andWhere("(p.end_date IS NULL OR p.end_date >= :from)", { from: q.from });
    }
    const ids = idsOf(b, "p.id");
    const [byStatus, taskRows, [rows, total]] = await Promise.all([
      grouped(b.clone(), "p.status", PROJECT_STATUSES),
      m.createQueryBuilder(Task, "t").select("COUNT(*)", "total").addSelect("COALESCE(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END), 0)", "done")
        .where(`t.project_id IN (${ids.getQuery()})`).setParameters(ids.getParameters()).getRawOne<{ total: string | number; done: string | number }>(),
      b.clone().orderBy("p.name", "ASC").addOrderBy("p.id", "ASC").skip((q.page - 1) * q.pageSize).take(q.pageSize).getManyAndCount(),
    ]);
    const pageIds = rows.map(p => p.id);
    const [progress, products, results, events, lines] = await Promise.all([
      projectProgress(m, pageIds),
      countBy(m.createQueryBuilder(AcademicProduct, "x"), "x.project_id", pageIds),
      countBy(m.createQueryBuilder(ResearchResult, "x"), "x.project_id", pageIds),
      countBy(m.createQueryBuilder(EventRecord, "x"), "x.project_id", pageIds),
      pageIds.length ? m.createQueryBuilder(ProjectResearchLine, "prl").innerJoin(ResearchLine, "l", "l.id = prl.research_line_id")
        .select(["prl.project_id AS \"projectId\"", "l.name AS name"]).where("prl.project_id IN (:...pageIds)", { pageIds }).orderBy("l.name", "ASC").getRawMany() : [],
    ]);
    const tasks = { total: Number(taskRows?.total ?? 0), done: Number(taskRows?.done ?? 0) };
    return {
      summary: { total, byStatus, tasks: { ...tasks, progress: percent(tasks.done, tasks.total) } },
      items: rows.map(p => {
        const t = progress.get(p.id)!;
        return { id: p.id, name: p.name, type: p.type, status: p.status, methodology: p.methodology, startDate: p.startDate, endDate: p.endDate,
          lines: (lines as { projectId: string; name: string }[]).filter(l => l.projectId === p.id).map(l => l.name),
          tasks: { total: t.total, done: t.done, progress: percent(t.done, t.total) },
          products: products.get(p.id) ?? 0, researchResults: results.get(p.id) ?? 0, events: events.get(p.id) ?? 0 };
      }),
      total, page: q.page, pageSize: q.pageSize,
    };
  }

  async products(actor: Actor, q: ProductReportQuery) {
    this.guard(actor, q);
    const m = this.db.manager, b = m.createQueryBuilder(AcademicProduct, "a").leftJoin(Project, "p", "p.id = a.project_id");
    if (q.type) b.andWhere("a.type = :type", { type: q.type });
    if (q.status) b.andWhere("a.status = :status", { status: q.status });
    if (q.projectType) b.andWhere("p.type = :projectType", { projectType: q.projectType });
    if (q.researchLineId) b.andWhere(lineOf("a.project_id"), { line: q.researchLineId });
    if (q.from || q.to) b.andWhere("a.product_date IS NOT NULL");
    if (q.from) b.andWhere("a.product_date >= :from", { from: q.from });
    if (q.to) b.andWhere("a.product_date <= :to", { to: q.to });
    const [byStatus, byType, total, rows] = await Promise.all([
      grouped(b.clone(), "a.status", PRODUCT_STATUSES),
      grouped(b.clone(), "a.type", PRODUCT_TYPES),
      b.clone().getCount(),
      b.clone().select(["a.id AS id", "a.title AS title", "a.type AS type", "a.status AS status", "a.product_date AS \"productDate\"", "p.id AS \"projectId\"", "p.name AS \"projectName\""])
        .addSelect("CASE WHEN a.product_date IS NULL THEN 1 ELSE 0 END", "nodate")
        .orderBy("nodate", "ASC").addOrderBy("a.product_date", "DESC").addOrderBy("a.title", "ASC").addOrderBy("a.id", "ASC")
        .offset((q.page - 1) * q.pageSize).limit(q.pageSize).getRawMany(),
    ]);
    const authors = await countBy(m.createQueryBuilder(ProductAuthor, "x"), "x.product_id", rows.map(r => r.id));
    return {
      summary: { total, byStatus, byType },
      items: rows.map(r => ({ id: r.id, title: r.title, type: r.type, status: r.status, productDate: r.productDate ?? null,
        project: r.projectId ? { id: r.projectId, name: r.projectName } : null, authors: authors.get(r.id) ?? 0 })),
      total, page: q.page, pageSize: q.pageSize,
    };
  }

  async events(actor: Actor, q: EventReportQuery) {
    this.guard(actor, q);
    const m = this.db.manager, b = m.createQueryBuilder(EventRecord, "e").leftJoin(Project, "p", "p.id = e.project_id");
    if (q.type) b.andWhere("e.type = :type", { type: q.type });
    if (q.status) b.andWhere("e.status = :status", { status: q.status });
    if (q.researchLineId) b.andWhere(lineOf("e.project_id"), { line: q.researchLineId });
    if (q.from) b.andWhere("e.starts_at >= :from", { from: bogotaStart(q.from) });
    if (q.to) b.andWhere("e.starts_at < :to", { to: bogotaStart(q.to, 1) });
    const ids = idsOf(b, "e.id");
    const [byStatus, total, attended, rows] = await Promise.all([
      grouped(b.clone(), "e.status", EVENT_STATUSES),
      b.clone().getCount(),
      m.createQueryBuilder(EventParticipant, "ep").where("ep.attendance = 'attended'").andWhere(`ep.event_id IN (${ids.getQuery()})`).setParameters(ids.getParameters()).getCount(),
      b.clone().select(["e.id AS id", "e.title AS title", "e.type AS type", "e.status AS status", "e.starts_at AS \"startsAt\"", "p.id AS \"projectId\"", "p.name AS \"projectName\""])
        .orderBy("e.starts_at", "DESC").addOrderBy("e.id", "ASC").offset((q.page - 1) * q.pageSize).limit(q.pageSize).getRawMany(),
    ]);
    const pageIds = rows.map(r => r.id);
    const [participants, attendances] = await Promise.all([
      countBy(m.createQueryBuilder(EventParticipant, "x"), "x.event_id", pageIds),
      countBy(m.createQueryBuilder(EventParticipant, "x").where("x.attendance = 'attended'"), "x.event_id", pageIds),
    ]);
    return {
      summary: { total, byStatus, attended },
      items: rows.map(r => ({ id: r.id, title: r.title, type: r.type, status: r.status, startsAt: r.startsAt,
        project: r.projectId ? { id: r.projectId, name: r.projectName } : null, participants: participants.get(r.id) ?? 0, attended: attendances.get(r.id) ?? 0 })),
      total, page: q.page, pageSize: q.pageSize,
    };
  }
}
