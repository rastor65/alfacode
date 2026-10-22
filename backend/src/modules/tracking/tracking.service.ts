import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, type ObjectLiteral, type SelectQueryBuilder } from "typeorm";
import { ApiError } from "../../common/api-error";
import { AcademicProduct, PRODUCT_STATUSES, ProductAuthor } from "../academic/academic.entities";
import { EVENT_STATUSES, EventParticipant, EventRecord } from "../events/event.entities";
import { actorRoles, type Actor, loadProjectWithAccess } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { PROJECT_STATUSES, PROJECT_TYPES, Project } from "../projects/project.entity";
import { ResearchResult } from "../research/research.entities";
import { isAuthority } from "../roles/role-policy";
import { Sprint, SprintClosureItem } from "../sprints/sprint.entity";
import { TASK_STATUSES, Task } from "../tasks/task.entity";
import { User } from "../users/user.entity";

// Definiciones, fuentes y permisos de cada indicador: docs/catalogo-indicadores.md (F6-01).
const forbidden = () => new ApiError(403, "TRACKING_FORBIDDEN", "Solo coordinacion y administracion consultan el panel institucional");
const DAY = 86_400_000;
/** Dia calendario de America/Bogota (UTC-5 fijo, sin horario de verano). */
export function bogotaDay(now: Date, plusDays = 0) {
  return new Date(now.getTime() - 5 * 3_600_000 + plusDays * DAY).toISOString().slice(0, 10);
}
/** Porcentaje solo con denominador; sin datos la UI muestra "Sin tareas", nunca 0 % ni 100 %. */
export const percent = (done: number, total: number) => (total > 0 ? Math.round((done * 100) / total) : null);

/** Conteo agrupado que devuelve todas las categorias conocidas, incluidas las que valen cero. */
export async function grouped<K extends string>(qb: SelectQueryBuilder<ObjectLiteral>, column: string, keys: readonly K[], counted = "*") {
  const rows: { key: K; count: string | number }[] = await qb.select(column, "key").addSelect(`COUNT(${counted})`, "count").groupBy(column).getRawMany();
  const result = Object.fromEntries(keys.map(key => [key, 0])) as Record<K, number>;
  for (const row of rows) if (row.key in result) result[row.key] = Number(row.count);
  return result;
}
export const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);
const taskSummary = (byStatus: Record<(typeof TASK_STATUSES)[number], number>) => {
  const total = sum(byStatus), done = byStatus.done;
  return { byStatus, total, done, pending: total - done, progress: percent(done, total) };
};

@Injectable()
export class TrackingService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async institutional(actor: Actor) {
    if (!isAuthority(actorRoles(actor))) throw forbidden();
    const m = this.db.manager, cutoff = new Date();
    const [activeMembers, projectsByStatus, projectsByType, eventsByStatus, attendances, productsByStatus, tasksByStatus] = await Promise.all([
      m.count(User, { where: { accountStatus: "active" } }),
      grouped(m.createQueryBuilder(Project, "p"), "p.status", PROJECT_STATUSES),
      grouped(m.createQueryBuilder(Project, "p"), "p.type", PROJECT_TYPES),
      grouped(m.createQueryBuilder(EventRecord, "e"), "e.status", EVENT_STATUSES),
      m.count(EventParticipant, { where: { attendance: "attended" } }),
      grouped(m.createQueryBuilder(AcademicProduct, "a"), "a.status", PRODUCT_STATUSES),
      grouped(m.createQueryBuilder(Task, "t"), "t.status", TASK_STATUSES),
    ]);
    return {
      cutoff: cutoff.toISOString(),
      members: { active: activeMembers },
      projects: { total: sum(projectsByStatus), byStatus: projectsByStatus, byType: projectsByType },
      events: { total: sum(eventsByStatus), byStatus: eventsByStatus, completed: eventsByStatus.completed, attendances },
      products: { total: sum(productsByStatus), byStatus: productsByStatus, published: productsByStatus.published },
      tasks: taskSummary(tasksByStatus),
    };
  }

  async project(actor: Actor, id: string) {
    const m = this.db.manager, cutoff = new Date(), today = bogotaDay(cutoff), soon = bogotaDay(cutoff, 7);
    const { project, access } = await loadProjectWithAccess(m, actor, id);
    const tasks = () => m.createQueryBuilder(Task, "t").where("t.project_id = :id", { id });
    const open = () => tasks().andWhere("t.status <> 'done'");
    const [byStatus, overdue, dueSoon, unassigned, results, productsByStatus, eventsByStatus, members, leaders] = await Promise.all([
      grouped(tasks(), "t.status", TASK_STATUSES),
      open().andWhere("t.due_date < :today", { today }).getCount(),
      open().andWhere("t.due_date >= :today AND t.due_date <= :soon", { today, soon }).getCount(),
      open().andWhere("t.assignee_id IS NULL").getCount(),
      m.count(ResearchResult, { where: { projectId: id } }),
      grouped(m.createQueryBuilder(AcademicProduct, "a").where("a.project_id = :id", { id }), "a.status", PRODUCT_STATUSES),
      grouped(m.createQueryBuilder(EventRecord, "e").where("e.project_id = :id", { id }), "e.status", EVENT_STATUSES),
      m.count(ProjectMember, { where: { projectId: id } }),
      m.count(ProjectMember, { where: { projectId: id, role: "leader" } }),
    ]);
    return {
      cutoff: cutoff.toISOString(), today,
      project: { id: project.id, name: project.name, status: project.status, type: project.type, methodology: project.methodology,
        startDate: project.startDate, endDate: project.endDate, access },
      tasks: { ...taskSummary(byStatus), overdue, dueSoon, unassigned },
      sprints: project.methodology === "agile" ? await this.sprints(m, id) : null,
      deliverables: { researchResults: results, products: { total: sum(productsByStatus), byStatus: productsByStatus } },
      events: { total: sum(eventsByStatus), byStatus: eventsByStatus },
      team: { members, leaders },
    };
  }

  /** Sprint activo con sus tareas actuales; el ultimo finalizado, con el registro de cierre. */
  private async sprints(m: EntityManager, projectId: string) {
    const [active, last] = await Promise.all([
      m.findOne(Sprint, { where: { projectId, status: "active" } }),
      m.findOne(Sprint, { where: { projectId, status: "completed" }, order: { finishedAt: "DESC", id: "ASC" } }),
    ]);
    const view = (s: Sprint) => ({ id: s.id, name: s.name, startDate: s.startDate, endDate: s.endDate });
    return {
      active: active ? { ...view(active), tasks: taskSummary(await grouped(m.createQueryBuilder(Task, "t").where("t.sprint_id = :id", { id: active.id }), "t.status", TASK_STATUSES)) } : null,
      lastCompleted: last ? { ...view(last), finishedAt: last.finishedAt, tasks: taskSummary(await grouped(
        m.createQueryBuilder(SprintClosureItem, "c").where("c.sprint_id = :id", { id: last.id }), "c.status_at_close", TASK_STATUSES)) } : null,
    };
  }

  async me(actor: Actor) {
    const m = this.db.manager, cutoff = new Date(), today = bogotaDay(cutoff), me = actor.id;
    // Misma visibilidad que los modulos de origen: autoridad ve todo; si no, solo proyectos de los que es miembro.
    const authority = isAuthority(actorRoles(actor));
    const member = (column: string) => `EXISTS (SELECT 1 FROM project_members vm WHERE vm.project_id = ${column} AND vm.user_id = :me)`;
    const inProject = (column: string) => (authority ? "1=1" : member(column));
    const optionalProject = (column: string) => (authority ? "1=1" : `(${column} IS NULL OR ${member(column)})`);

    const memberships = () => m.createQueryBuilder(ProjectMember, "pm").innerJoin(Project, "p", "p.id = pm.project_id").where("pm.user_id = :me", { me });
    const myTasks = () => m.createQueryBuilder(Task, "t").where("t.assignee_id = :me", { me }).andWhere(inProject("t.project_id"));
    const participations = () => m.createQueryBuilder(EventParticipant, "ep").innerJoin(EventRecord, "e", "e.id = ep.event_id")
      .where("ep.user_id = :me", { me }).andWhere(optionalProject("e.project_id"));

    const [projectsByStatus, leading, projectList, openTasks, overdue, doneTasks, taskList, attended, upcoming, productsByStatus] = await Promise.all([
      grouped(memberships(), "p.status", PROJECT_STATUSES),
      memberships().andWhere("pm.role = 'leader'").getCount(),
      memberships().select(["p.id AS id", "p.name AS name", "p.status AS status", "pm.role AS role"]).orderBy("p.name", "ASC").addOrderBy("p.id", "ASC").limit(10).getRawMany(),
      myTasks().andWhere("t.status <> 'done'").getCount(),
      myTasks().andWhere("t.status <> 'done' AND t.due_date < :today", { today }).getCount(),
      myTasks().andWhere("t.status = 'done'").getCount(),
      myTasks().andWhere("t.status <> 'done'").innerJoin(Project, "p", "p.id = t.project_id")
        .select(["t.id AS id", "t.title AS title", "t.status AS status", "t.due_date AS \"dueDate\"", "p.id AS \"projectId\"", "p.name AS \"projectName\""])
        .addSelect("CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END", "nodue")
        .orderBy("nodue", "ASC").addOrderBy("t.due_date", "ASC").addOrderBy("t.title", "ASC").addOrderBy("t.id", "ASC").limit(10).getRawMany(),
      participations().andWhere("ep.attendance = 'attended'").getCount(),
      participations().andWhere("e.status = 'scheduled' AND e.starts_at > :now", { now: cutoff.toISOString() })
        .select(["e.id AS id", "e.title AS title", "e.starts_at AS \"startsAt\"", "e.mode AS mode", "e.project_id AS \"projectId\""])
        .orderBy("e.starts_at", "ASC").addOrderBy("e.id", "ASC").limit(5).getRawMany(),
      grouped(m.createQueryBuilder(ProductAuthor, "pa").innerJoin(AcademicProduct, "a", "a.id = pa.product_id")
        .where("pa.user_id = :me", { me }).andWhere(optionalProject("a.project_id")), "a.status", PRODUCT_STATUSES, "DISTINCT a.id"),
    ]);
    return {
      cutoff: cutoff.toISOString(), today,
      projects: { total: sum(projectsByStatus), byStatus: projectsByStatus, leading,
        items: projectList.map(row => ({ id: row.id, name: row.name, status: row.status, role: row.role })) },
      tasks: { open: openTasks, overdue, done: doneTasks,
        items: taskList.map(row => ({ id: row.id, title: row.title, status: row.status, dueDate: row.dueDate ?? null, projectId: row.projectId, projectName: row.projectName })) },
      events: { attended, upcoming: upcoming.map(row => ({ id: row.id, title: row.title, startsAt: row.startsAt, mode: row.mode, projectId: row.projectId ?? null })) },
      products: { total: sum(productsByStatus), byStatus: productsByStatus },
    };
  }
}
