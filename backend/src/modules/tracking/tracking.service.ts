import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In, type EntityManager, type ObjectLiteral, type SelectQueryBuilder } from "typeorm";
import { ApiError } from "../../common/api-error";
import { AcademicProduct, PRODUCT_STATUSES, ProductAuthor } from "../academic/academic.entities";
import { AdministrativeRequest } from "../administration/administrative-request.entity";
import { EVENT_STATUSES, EventParticipant, EventRecord } from "../events/event.entities";
import { MembershipRequest } from "../membership/membership-request.entity";
import { actorRoles, type Actor, loadProjectWithAccess } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { PROJECT_STATUSES, PROJECT_TYPES, Project } from "../projects/project.entity";
import { ResearchResult } from "../research/research.entities";
import { isAuthority } from "../roles/role-policy";
import { Sprint, SprintClosureItem } from "../sprints/sprint.entity";
import { TASK_STATUSES, Task } from "../tasks/task.entity";
import { User } from "../users/user.entity";
import { ProjectObservation } from "./project-observation.entity";
import { bogotaDay, elapsed, instant, percent, projectCards, projectSignals, risks } from "./project-metrics";

// Los calculos por proyecto viven en project-metrics; se reexportan para los consumidores existentes.
export { bogotaDay, elapsed, instant, percent, risks };

// Definiciones, fuentes y permisos de cada indicador: docs/catalogo-indicadores.md (F6-01).
const forbidden = () => new ApiError(403, "TRACKING_FORBIDDEN", "Solo coordinacion y administracion consultan el panel institucional");
/** Conteo agrupado que devuelve todas las categorias conocidas, incluidas las que valen cero. */
export async function grouped<K extends string>(qb: SelectQueryBuilder<ObjectLiteral>, column: string, keys: readonly K[], counted = "*") {
  const rows: { key: K; count: string | number }[] = await qb.select(column, "key").addSelect(`COUNT(${counted})`, "count").groupBy(column).getRawMany();
  const result = Object.fromEntries(keys.map(key => [key, 0])) as Record<K, number>;
  for (const row of rows) if (row.key in result) result[row.key] = Number(row.count);
  return result;
}
export const sum = (values: Record<string, number>) => Object.values(values).reduce((a, b) => a + b, 0);
const ONGOING = ["active", "paused", "planning", "proposed"] as const;
const excerpt = (text: string) => (text.length > 200 ? `${text.slice(0, 199).trimEnd()}…` : text);
const count = (value: unknown) => Number(value ?? 0);
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
    const [byStatus, overdue, dueSoon, unassigned, results, productsByStatus, eventsByStatus, members, leaders, signals, myTasks] = await Promise.all([
      grouped(tasks(), "t.status", TASK_STATUSES),
      open().andWhere("t.due_date < :today", { today }).getCount(),
      open().andWhere("t.due_date >= :today AND t.due_date <= :soon", { today, soon }).getCount(),
      open().andWhere("t.assignee_id IS NULL").getCount(),
      m.count(ResearchResult, { where: { projectId: id } }),
      grouped(m.createQueryBuilder(AcademicProduct, "a").where("a.project_id = :id", { id }), "a.status", PRODUCT_STATUSES),
      grouped(m.createQueryBuilder(EventRecord, "e").where("e.project_id = :id", { id }), "e.status", EVENT_STATUSES),
      m.count(ProjectMember, { where: { projectId: id } }),
      m.count(ProjectMember, { where: { projectId: id, role: "leader" } }),
      projectSignals(m, [project], cutoff, actor.id),
      // M-09: mis tareas abiertas en este proyecto, las de fecha limite mas proxima primero (sin fecha al final).
      open().andWhere("t.assignee_id = :me", { me: actor.id })
        .select(["t.id AS id", "t.title AS title", "t.status AS status", "t.priority AS priority", "t.due_date AS \"dueDate\""])
        .addSelect("CASE WHEN t.due_date IS NULL THEN 1 ELSE 0 END", "nodue")
        .orderBy("nodue", "ASC").addOrderBy("t.due_date", "ASC").addOrderBy("t.title", "ASC").addOrderBy("t.id", "ASC").limit(5).getRawMany(),
    ]);
    const signal = signals.get(project.id)!;
    return {
      cutoff: cutoff.toISOString(), today,
      project: { id: project.id, name: project.name, status: project.status, type: project.type, methodology: project.methodology,
        startDate: project.startDate, endDate: project.endDate, access },
      tasks: { ...taskSummary(byStatus), overdue, dueSoon, unassigned },
      // G-02 a G-04 del proyecto (solo los activos tienen alertas) y mis tareas abiertas (M-09).
      signals: { elapsed: signal.elapsed, lastActivityAt: signal.lastActivityAt, risks: signal.risks },
      myTasks: { open: signal.myOpen, items: myTasks.map(row => ({ id: row.id, title: row.title, status: row.status, priority: row.priority, dueDate: row.dueDate ?? null })) },
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

    const [projectsByStatus, leading, projectList, openTasks, overdue, doneTasks, taskList, attended, upcoming, productsByStatus, dueSoon, tasksByStatus, observations] = await Promise.all([
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
      participations().andWhere("e.status = 'scheduled' AND e.starts_at > :now", { now: cutoff.toISOString() }).leftJoin(Project, "ep_p", "ep_p.id = e.project_id")
        .select(["e.id AS id", "e.title AS title", "e.starts_at AS \"startsAt\"", "e.mode AS mode", "e.project_id AS \"projectId\"", "ep_p.name AS \"projectName\""])
        .orderBy("e.starts_at", "ASC").addOrderBy("e.id", "ASC").limit(5).getRawMany(),
      grouped(m.createQueryBuilder(ProductAuthor, "pa").innerJoin(AcademicProduct, "a", "a.id = pa.product_id")
        .where("pa.user_id = :me", { me }).andWhere(optionalProject("a.project_id")), "a.status", PRODUCT_STATUSES, "DISTINCT a.id"),
      myTasks().andWhere("t.status <> 'done' AND t.due_date >= :today AND t.due_date <= :soon", { today, soon: bogotaDay(cutoff, 7) }).getCount(),
      grouped(myTasks(), "t.status", TASK_STATUSES),
      this.recentObservations(m, member("o.project_id"), { me }),
    ]);
    const projectIds = projectList.map(row => row.id as string);
    const [cards, leaders] = await Promise.all([projectCards(m, projectIds, today, me), this.leaders(m, projectIds)]);
    return {
      cutoff: cutoff.toISOString(), today,
      projects: { total: sum(projectsByStatus), byStatus: projectsByStatus, leading,
        items: projectList.map(row => ({ id: row.id, name: row.name, status: row.status, role: row.role, ...cards.get(row.id)!, leaders: leaders.get(row.id) ?? [] })) },
      tasks: { open: openTasks, overdue, dueSoon, done: doneTasks, byStatus: tasksByStatus,
        items: taskList.map(row => ({ id: row.id, title: row.title, status: row.status, dueDate: row.dueDate ?? null, projectId: row.projectId, projectName: row.projectName })) },
      events: { attended, upcoming: upcoming.map(row => ({ id: row.id, title: row.title, startsAt: row.startsAt, mode: row.mode, projectId: row.projectId ?? null, projectName: row.projectName ?? null })) },
      products: { total: sum(productsByStatus), byStatus: productsByStatus },
      observations,
    };
  }

  /** G-01 a G-07: panel del semillero en /hub; complementa a institutional() sin repetir sus conteos. */
  async overview(actor: Actor) {
    if (!isAuthority(actorRoles(actor))) throw forbidden();
    const m = this.db.manager, cutoff = new Date(), today = bogotaDay(cutoff);
    const [rows, ongoing, membershipPending, requestsPending, requestsInReview, agenda, observations, products] = await Promise.all([
      m.createQueryBuilder(Project, "p").where("p.status IN (:...ongoing)", { ongoing: ONGOING })
        .select(["p.id AS id", "p.name AS name", "p.type AS type", "p.methodology AS methodology", "p.status AS status",
          "p.start_date AS \"startDate\"", "p.end_date AS \"endDate\"", "p.updated_at AS \"updatedAt\""])
        .addSelect("CASE p.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 WHEN 'planning' THEN 2 ELSE 3 END", "stage")
        .orderBy("stage", "ASC").addOrderBy("p.name", "ASC").addOrderBy("p.id", "ASC").limit(50).getRawMany(),
      m.count(Project, { where: { status: In([...ONGOING]) } }),
      m.count(MembershipRequest, { where: { status: "pending" } }),
      m.count(AdministrativeRequest, { where: { status: "pending" } }),
      m.count(AdministrativeRequest, { where: { status: "in_review" } }),
      m.createQueryBuilder(EventRecord, "e").leftJoin(Project, "p", "p.id = e.project_id")
        .where("e.status = 'scheduled' AND e.starts_at > :now", { now: cutoff.toISOString() })
        .select(["e.id AS id", "e.title AS title", "e.starts_at AS \"startsAt\"", "e.mode AS mode", "p.id AS \"projectId\"", "p.name AS \"projectName\""])
        .orderBy("e.starts_at", "ASC").addOrderBy("e.id", "ASC").limit(5).getRawMany(),
      this.recentObservations(m, "1=1", {}),
      m.createQueryBuilder(AcademicProduct, "a").leftJoin(Project, "p", "p.id = a.project_id")
        .select(["a.id AS id", "a.title AS title", "a.status AS status", "a.created_at AS \"createdAt\"", "p.id AS \"projectId\"", "p.name AS \"projectName\""])
        .orderBy("a.created_at", "DESC").addOrderBy("a.id", "ASC").limit(5).getRawMany(),
    ]);
    const ids = rows.map(row => row.id as string);
    const [signals, leaders] = await Promise.all([projectSignals(m, rows, cutoff), this.leaders(m, ids)]);
    const projects = rows.map(row => {
      const { tasks, overdue, sprint, elapsed, lastActivityAt, risks } = signals.get(row.id)!;
      return {
        id: row.id as string, name: row.name as string, type: row.type, methodology: row.methodology, status: row.status, startDate: row.startDate ?? null, endDate: row.endDate ?? null,
        leaders: leaders.get(row.id) ?? [], tasks, overdue, sprint, elapsed, lastActivityAt, risks,
      };
    });
    const place = (row: { projectId: string | null; projectName: string | null }) => (row.projectId ? { id: row.projectId, name: row.projectName } : null);
    return {
      cutoff: cutoff.toISOString(), today,
      projects: { total: ongoing, items: projects },
      pending: { membershipRequests: membershipPending, administrativeRequests: { pending: requestsPending, inReview: requestsInReview } },
      agenda: agenda.map(row => ({ id: row.id, title: row.title, startsAt: row.startsAt, mode: row.mode, project: place(row) })),
      recent: {
        observations,
        products: products.map(row => ({ id: row.id, title: row.title, status: row.status, createdAt: instant(row.createdAt)!.toISOString(), project: place(row) })),
      },
    };
  }

  private async leaders(m: EntityManager, ids: string[]) {
    const result = new Map<string, { id: string; fullName: string }[]>();
    if (!ids.length) return result;
    const rows = await m.createQueryBuilder(ProjectMember, "pm").innerJoin(User, "u", "u.id = pm.user_id")
      .select(["pm.project_id AS \"projectId\"", "u.id AS id", "u.full_name AS \"fullName\""])
      .where("pm.project_id IN (:...ids) AND pm.role = 'leader'", { ids }).orderBy("u.full_name", "ASC").addOrderBy("u.id", "ASC").getRawMany();
    for (const row of rows) result.set(row.projectId, [...(result.get(row.projectId) ?? []), { id: row.id, fullName: row.fullName }]);
    return result;
  }

  /** M-10/G-07: observaciones recientes con extracto; `scope` limita a los proyectos visibles. */
  private async recentObservations(m: EntityManager, scope: string, params: Record<string, string>) {
    const rows = await m.createQueryBuilder(ProjectObservation, "o").innerJoin(Project, "p", "p.id = o.project_id").leftJoin(User, "u", "u.id = o.author_id")
      .select(["o.id AS id", "o.kind AS kind", "o.body AS body", "o.created_at AS \"createdAt\"", "p.id AS \"projectId\"", "p.name AS \"projectName\"", "u.full_name AS \"authorName\""])
      .where(scope, params).orderBy("o.created_at", "DESC").addOrderBy("o.id", "ASC").limit(5).getRawMany();
    return rows.map(row => ({ id: row.id, kind: row.kind, excerpt: excerpt(row.body), createdAt: instant(row.createdAt)!.toISOString(),
      project: { id: row.projectId, name: row.projectName }, author: row.authorName ?? null }));
  }
}
