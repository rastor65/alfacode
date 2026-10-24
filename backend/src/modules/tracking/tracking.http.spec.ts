import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { AcademicProduct, ProductAuthor } from "../academic/academic.entities";
import { EventParticipant, EventRecord } from "../events/event.entities";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { ResearchResult } from "../research/research.entities";
import { Sprint, SprintClosureItem } from "../sprints/sprint.entity";
import { Task } from "../tasks/task.entity";
import { bogotaDay, percent } from "./tracking.service";

// F6-07 anticipado para I-23: datos sinteticos con resultados conocidos, contados a mano.
// La base en memoria es exclusiva de este archivo; el panel institucional se prueba primero.
type Session = { cookies: string[]; csrf: string; id: string };
let h: HttpHarness, counter = 0;
const s: Record<"coord" | "teacher" | "leader" | "member" | "outsider", Session> = {} as never;
const ids: Record<string, string> = {};
const get = (who: Session, path: string) => h.request(path, { cookies: who.cookies, csrf: who.csrf });
async function person(role: "coordinator" | "teacher_leader" | "student") {
  const email = `seguimiento-${++counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [role] });
  return { ...await h.loginOk(email), id: user.id };
}

before(async () => {
  h = await startHttpHarness();
  const db = h.dataSource.manager, now = new Date(), day = (n: number) => bogotaDay(now, n);
  s.coord = await person("coordinator"); s.teacher = await person("teacher_leader");
  s.leader = await person("student"); s.member = await person("student"); s.outsider = await person("student");
  await h.createUser(`seguimiento-inactiva@uniguajira.edu.co`, { status: "inactive" });
  await h.createUser(`seguimiento-pendiente@uniguajira.edu.co`, { status: "pending" });

  const project = (name: string, type: Project["type"], methodology: Project["methodology"], status: Project["status"]) =>
    db.save(db.create(Project, { name, type, methodology, status, startDate: "2026-01-15", endDate: "2026-12-15" }));
  const alfa = await project("Alfa", "research", "agile", "active");
  const beta = await project("Beta", "software", "traditional", "completed");
  const gamma = await project("Gamma", "research", "traditional", "proposed");
  Object.assign(ids, { alfa: alfa.id, beta: beta.id, gamma: gamma.id });
  await db.save(ProjectMember, [
    { projectId: alfa.id, userId: s.leader.id, role: "leader" }, { projectId: alfa.id, userId: s.member.id, role: "collaborator" },
    { projectId: beta.id, userId: s.outsider.id, role: "collaborator" },
  ]);

  const older = await db.save(db.create(Sprint, { projectId: alfa.id, name: "Sprint 0", startDate: "2026-07-01", endDate: "2026-07-14", status: "completed", finishedAt: new Date("2026-07-14T20:00:00Z") }));
  const closed = await db.save(db.create(Sprint, { projectId: alfa.id, name: "Sprint 1", startDate: "2026-08-01", endDate: "2026-08-14", status: "completed", finishedAt: new Date("2026-08-14T20:00:00Z") }));
  const active = await db.save(db.create(Sprint, { projectId: alfa.id, name: "Sprint 2", startDate: day(-3), endDate: day(10), status: "active" }));
  ids.closedSprint = closed.id; ids.activeSprint = active.id;
  const task = (projectId: string, title: string, status: Task["status"], assigneeId: string | null, dueDate: string | null, sprintId: string | null = null) =>
    db.save(db.create(Task, { projectId, title, status, assigneeId, dueDate, sprintId, priority: "medium" }));
  const t1 = await task(alfa.id, "T1 hecha", "done", s.member.id, null);
  const t2 = await task(alfa.id, "T2 hecha", "done", s.member.id, day(-20));
  const t3 = await task(alfa.id, "T3 vencida", "in_progress", s.member.id, day(-1), active.id);
  await task(alfa.id, "T4 proxima", "todo", s.member.id, day(3), active.id);
  await task(alfa.id, "T5 sin responsable", "todo", null, null);
  await task(alfa.id, "T6 del lider", "in_review", s.leader.id, day(10));
  await task(beta.id, "T7 ajena hecha", "done", s.outsider.id, null);
  await task(beta.id, "T8 ajena asignada al miembro", "todo", s.member.id, day(-5));
  // El cierre del Sprint 1 registro T3 como pendiente; hoy esta en curso en otro sprint.
  await db.save(SprintClosureItem, [
    { sprintId: closed.id, taskId: t1.id, statusAtClose: "done", closedAt: closed.finishedAt! },
    { sprintId: closed.id, taskId: t2.id, statusAtClose: "done", closedAt: closed.finishedAt! },
    { sprintId: closed.id, taskId: t3.id, statusAtClose: "todo", closedAt: closed.finishedAt! },
    { sprintId: older.id, taskId: t1.id, statusAtClose: "in_progress", closedAt: older.finishedAt! },
  ]);

  const event = (title: string, status: EventRecord["status"], projectId: string | null, startsAt: string) =>
    db.save(db.create(EventRecord, { title, type: "meeting", status, mode: "online", url: "https://example.org/sala", startsAt, endsAt: startsAt.replace("T15", "T16"), organizerId: s.coord.id, projectId }));
  const e1 = await event("E1 institucional realizada", "completed", null, "2026-09-01T15:00:00.000Z");
  const e2 = await event("E2 proxima de Alfa", "scheduled", alfa.id, "2027-03-01T15:00:00.000Z");
  const e3 = await event("E3 de Beta realizada", "completed", beta.id, "2026-09-10T15:00:00.000Z");
  await event("E4 cancelada", "cancelled", null, "2026-09-20T15:00:00.000Z");
  const attendance = (eventId: string, userId: string, value: EventParticipant["attendance"]) => ({ eventId, userId, role: "participant" as const, attendance: value });
  await db.save(EventParticipant, [
    attendance(e1.id, s.member.id, "attended"), attendance(e1.id, s.leader.id, "absent"), attendance(e2.id, s.member.id, "registered"),
    attendance(e3.id, s.outsider.id, "attended"), attendance(e3.id, s.member.id, "attended"),
  ]);

  const product = async (title: string, status: AcademicProduct["status"], projectId: string | null, authors: string[]) => {
    const row = await db.save(db.create(AcademicProduct, { title, type: "article", status, projectId }));
    await db.save(ProductAuthor, authors.map((userId, index) => ({ productId: row.id, position: index + 1, userId, externalName: null })));
  };
  await product("A1 publicado de Alfa", "published", alfa.id, [s.member.id, s.leader.id]);
  await product("A2 institucional", "in_progress", null, [s.member.id]);
  await product("A3 de Beta", "submitted", beta.id, [s.member.id, s.outsider.id]);
  await product("A4 aceptado de Alfa", "accepted", alfa.id, [s.leader.id]);
  await db.save(ResearchResult, [db.create(ResearchResult, { projectId: alfa.id, title: "Hallazgo 1" }), db.create(ResearchResult, { projectId: alfa.id, title: "Hallazgo 2" })]);
});
after(async () => { await h?.close(); });

describe("I-23: reglas comunes", () => {
  it("dia de Bogota y porcentajes sin denominador cero", () => {
    assert.equal(bogotaDay(new Date("2026-10-22T03:00:00Z")), "2026-10-21");
    assert.equal(bogotaDay(new Date("2026-10-22T05:00:00Z")), "2026-10-22");
    assert.equal(bogotaDay(new Date("2026-12-31T20:00:00Z"), 1), "2027-01-01");
    assert.equal(percent(0, 0), null); assert.equal(percent(1, 3), 33); assert.equal(percent(3, 8), 38); assert.equal(percent(0, 4), 0);
  });
});

describe("I-23: panel institucional (F6-02)", () => {
  it("coincide con la fixture contada a mano", async () => {
    const r = await get(s.coord, "/tracking/institutional");
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.ok(Date.parse(d.cutoff));
    assert.equal(d.members.active, 5); // coord, docente lider y tres estudiantes; no inactiva ni pendiente
    assert.deepEqual(d.projects.byStatus, { proposed: 1, planning: 0, active: 1, paused: 0, completed: 1, cancelled: 0 });
    assert.deepEqual(d.projects.byType, { research: 2, software: 1, innovation: 0, extension: 0, internal: 0, other: 0 });
    assert.deepEqual(d.events.byStatus, { scheduled: 1, in_progress: 0, completed: 2, cancelled: 1 });
    assert.equal(d.events.completed, 2);
    assert.equal(d.events.attendances, 3); // inscripcion "registered" y ausencia no cuentan
    assert.deepEqual(d.products.byStatus, { in_progress: 1, submitted: 1, accepted: 1, published: 1, rejected: 0 });
    assert.equal(d.products.total, 4); assert.equal(d.products.published, 1);
    assert.deepEqual(d.tasks, { byStatus: { todo: 3, in_progress: 1, in_review: 1, done: 3 }, total: 8, done: 3, pending: 5, progress: 38 });
  });
  it("solo autoridades: estudiantes y docente lider reciben 403; sin sesion 401", async () => {
    for (const who of [s.member, s.leader, s.teacher, s.outsider]) {
      const r = await get(who, "/tracking/institutional");
      assert.equal(r.response.status, 403, r.text);
      assert.equal(r.text.includes("\"total\""), false);
    }
    assert.equal((await h.request("/tracking/institutional")).response.status, 401);
  });
});

describe("I-23: panel de proyecto (F6-03)", () => {
  it("avance, vencidas, proximas, sin responsable, entregables, actividades y equipo", async () => {
    const r = await get(s.member, `/tracking/projects/${ids.alfa}`);
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.equal(d.project.access, "collaborator");
    assert.deepEqual(d.tasks, { byStatus: { todo: 2, in_progress: 1, in_review: 1, done: 2 }, total: 6, done: 2, pending: 4, progress: 33, overdue: 1, dueSoon: 1, unassigned: 1 });
    assert.deepEqual(d.deliverables, { researchResults: 2, products: { total: 2, byStatus: { in_progress: 0, submitted: 0, accepted: 1, published: 1, rejected: 0 } } });
    assert.deepEqual(d.events.byStatus, { scheduled: 1, in_progress: 0, completed: 0, cancelled: 0 });
    assert.deepEqual(d.team, { members: 2, leaders: 1 });
    assert.equal(d.project.startDate, "2026-01-15");
  });
  it("sprint activo con tareas actuales y ultimo cierre desde el snapshot", async () => {
    const d = (await get(s.leader, `/tracking/projects/${ids.alfa}`)).json;
    assert.equal(d.sprints.active.id, ids.activeSprint);
    assert.deepEqual(d.sprints.active.tasks, { byStatus: { todo: 1, in_progress: 1, in_review: 0, done: 0 }, total: 2, done: 0, pending: 2, progress: 0 });
    assert.equal(d.sprints.lastCompleted.id, ids.closedSprint); // el mas reciente, no Sprint 0
    // T3 figura como "todo" en el cierre aunque hoy este en curso.
    assert.deepEqual(d.sprints.lastCompleted.tasks, { byStatus: { todo: 1, in_progress: 0, in_review: 0, done: 2 }, total: 3, done: 2, pending: 1, progress: 67 });
  });
  it("sin tareas no informa 0 % ni 100 %; proyecto tradicional sin sprints", async () => {
    const d = (await get(s.coord, `/tracking/projects/${ids.gamma}`)).json;
    assert.equal(d.tasks.total, 0); assert.equal(d.tasks.progress, null);
    assert.equal(d.sprints, null); assert.equal(d.project.access, "authority");
  });
  it("sin acceso responde 404 sin revelar el proyecto; UUID invalido 400", async () => {
    for (const path of [`/tracking/projects/${ids.alfa}`, `/tracking/projects/${randomUUID()}`]) {
      const r = await get(s.outsider, path);
      assert.equal(r.response.status, 404, r.text);
      assert.equal(r.text.includes("Alfa"), false);
    }
    assert.equal((await get(s.teacher, `/tracking/projects/${ids.alfa}`)).response.status, 404);
    assert.equal((await get(s.coord, "/tracking/projects/no-es-uuid")).response.status, 400);
  });
});

describe("I-23: panel personal (F6-04)", () => {
  it("integrante: solo sus datos y solo lo visible (excluye tarea, asistencia y producto de un proyecto ajeno)", async () => {
    const r = await get(s.member, "/tracking/me");
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.deepEqual(d.projects.byStatus, { proposed: 0, planning: 0, active: 1, paused: 0, completed: 0, cancelled: 0 });
    assert.equal(d.projects.leading, 0);
    assert.deepEqual(d.projects.items.map(({ id, name, status, role }: Record<string, string>) => ({ id, name, status, role })), [{ id: ids.alfa, name: "Alfa", status: "active", role: "collaborator" }]);
    assert.equal(d.tasks.open, 2); assert.equal(d.tasks.overdue, 1); assert.equal(d.tasks.done, 2);
    assert.deepEqual(d.tasks.items.map((t: { title: string }) => t.title), ["T3 vencida", "T4 proxima"]);
    assert.equal(d.tasks.items[0].projectName, "Alfa");
    assert.equal(d.events.attended, 1);
    assert.deepEqual(d.events.upcoming.map((e: { title: string }) => e.title), ["E2 proxima de Alfa"]);
    assert.deepEqual(d.products, { total: 2, byStatus: { in_progress: 1, submitted: 0, accepted: 0, published: 1, rejected: 0 } });
    for (const hidden of ["T8", "E3", "A3", "Beta"]) assert.equal(r.text.includes(hidden), false, hidden);
  });
  it("no hay forma de pedir el panel de otra persona", async () => {
    const own = (await get(s.member, "/tracking/me")).json;
    const tampered = (await get(s.member, `/tracking/me?userId=${s.leader.id}&user=${s.leader.id}`)).json;
    assert.equal(tampered.tasks.open, own.tasks.open); assert.equal(tampered.projects.leading, 0);
    assert.equal((await get(s.member, `/tracking/me/${s.leader.id}`)).response.status, 404);
  });
  it("lider, persona de otro proyecto y autoridad sin equipos", async () => {
    const leader = (await get(s.leader, "/tracking/me")).json;
    assert.equal(leader.projects.leading, 1); assert.equal(leader.tasks.open, 1); assert.equal(leader.tasks.done, 0);
    assert.equal(leader.events.attended, 0); assert.equal(leader.products.total, 2);
    const outsider = (await get(s.outsider, "/tracking/me")).json;
    assert.equal(outsider.projects.byStatus.completed, 1); assert.equal(outsider.tasks.done, 1);
    assert.equal(outsider.events.attended, 1); assert.equal(outsider.products.total, 1);
    const coord = (await get(s.coord, "/tracking/me")).json;
    assert.equal(coord.projects.total, 0); assert.equal(coord.tasks.open, 0); assert.equal(coord.products.total, 0);
    assert.equal((await h.request("/tracking/me")).response.status, 401);
  });
});

describe("I-25: criterios de aceptacion F6", () => {
  it("terminadas cuenta cada tarea una vez aunque figure en varios cierres de sprint", async () => {
    // T1 figura en dos cierres (Sprint 0 y Sprint 1) y T3 en un cierre y en el sprint activo.
    const closures = await h.dataSource.manager.count(SprintClosureItem);
    const tasks = await h.dataSource.manager.count(Task);
    const d = (await get(s.coord, "/tracking/institutional")).json;
    assert.equal(closures, 4);
    assert.equal(d.tasks.total, tasks); assert.equal(d.tasks.done, 3);
    const p = (await get(s.coord, `/tracking/projects/${ids.alfa}`)).json;
    assert.equal(p.tasks.total, 6); assert.equal(p.tasks.done, 2);
  });
  it("agregar datos a un proyecto ajeno no cambia ninguna cifra visible para quien no tiene acceso", async () => {
    const db = h.dataSource.manager;
    const before = { me: (await get(s.outsider, "/tracking/me")).json, institutional: (await get(s.outsider, "/tracking/institutional")).response.status };
    const task = await db.save(db.create(Task, { projectId: ids.alfa, title: "Tarea privada nueva", status: "done", assigneeId: s.outsider.id, priority: "medium" }));
    const event = await db.save(db.create(EventRecord, { title: "Privada de Alfa", type: "meeting", status: "completed", mode: "online", url: "https://example.org/sala", startsAt: "2026-09-05T15:00:00.000Z", endsAt: "2026-09-05T16:00:00.000Z", organizerId: s.coord.id, projectId: ids.alfa }));
    await db.save(EventParticipant, { eventId: event.id, userId: s.outsider.id, role: "participant", attendance: "attended" });
    const product = await db.save(db.create(AcademicProduct, { title: "Privado de Alfa", type: "article", status: "published", projectId: ids.alfa }));
    await db.save(ProductAuthor, { productId: product.id, position: 1, userId: s.outsider.id, externalName: null });
    try {
      const after = (await get(s.outsider, "/tracking/me")).json;
      for (const key of ["projects", "tasks", "events", "products"]) assert.deepEqual(after[key], before.me[key], key);
      assert.equal((await get(s.outsider, "/tracking/institutional")).response.status, before.institutional);
      assert.equal((await get(s.outsider, `/tracking/projects/${ids.alfa}`)).response.status, 404);
      // La autoridad si ve el cambio: la diferencia proviene del filtro de permisos, no de datos ausentes.
      assert.equal((await get(s.coord, `/tracking/projects/${ids.alfa}`)).json.tasks.total, 7);
    } finally {
      await db.delete(ProductAuthor, { productId: product.id }); await db.delete(AcademicProduct, { id: product.id });
      await db.delete(EventParticipant, { eventId: event.id }); await db.delete(EventRecord, { id: event.id }); await db.delete(Task, { id: task.id });
    }
  });
});

