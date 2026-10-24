import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { AcademicProduct } from "../academic/academic.entities";
import { AdministrativeRequest } from "../administration/administrative-request.entity";
import { EventParticipant, EventRecord } from "../events/event.entities";
import { MembershipRequest } from "../membership/membership-request.entity";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { Sprint } from "../sprints/sprint.entity";
import { Task } from "../tasks/task.entity";
import { User } from "../users/user.entity";
import { ProjectObservation } from "./project-observation.entity";
import { bogotaDay, elapsed, instant, risks } from "./tracking.service";

// I-26 (DEC-049): panel /hub segun el rol. Fechas relativas al dia de la prueba para que el
// tiempo transcurrido y las alertas (G-02, G-04) tengan resultados conocidos. Base exclusiva del archivo.
type Session = { cookies: string[]; csrf: string; id: string };
let h: HttpHarness, counter = 0;
const s: Record<"coord" | "teacher" | "member" | "outsider", Session> = {} as never;
const ids: Record<string, string> = {};
const get = (who: Session, path: string) => h.request(path, { cookies: who.cookies, csrf: who.csrf });
async function person(role: "coordinator" | "teacher_leader" | "student", fullName: string) {
  const email = `panel-${++counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [role] });
  await h.dataSource.manager.update(User, { id: user.id }, { fullName });
  return { ...await h.loginOk(email), id: user.id };
}

before(async () => {
  h = await startHttpHarness();
  const db = h.dataSource.manager, now = new Date(), day = (n: number) => bogotaDay(now, n);
  s.coord = await person("coordinator", "Coordinadora Ficticia"); s.teacher = await person("teacher_leader", "Docente Ficticio");
  s.member = await person("student", "Estudiante Ficticia"); s.outsider = await person("student", "Estudiante Ajeno");

  const project = (name: string, status: Project["status"], methodology: Project["methodology"], startDate: string | null, endDate: string | null) =>
    db.save(db.create(Project, { name, type: "research", methodology, status, startDate, endDate }));
  const delta = await project("Delta", "active", "agile", day(-50), day(50));
  const epsilon = await project("Epsilon", "active", "traditional", day(-100), day(-1));
  const zeta = await project("Zeta", "paused", "traditional", day(-10), day(-2));
  const eta = await project("Eta", "proposed", "traditional", null, null);
  const theta = await project("Theta", "completed", "traditional", null, null);
  Object.assign(ids, { delta: delta.id, epsilon: epsilon.id, zeta: zeta.id, eta: eta.id, theta: theta.id });
  await db.save(ProjectMember, [
    { projectId: delta.id, userId: s.teacher.id, role: "leader" }, { projectId: delta.id, userId: s.member.id, role: "collaborator" },
    { projectId: zeta.id, userId: s.outsider.id, role: "leader" },
  ]);

  const sprint = await db.save(db.create(Sprint, { projectId: delta.id, name: "Sprint 3", startDate: day(-5), endDate: day(9), status: "active" }));
  ids.sprint = sprint.id;
  const task = (projectId: string, title: string, status: Task["status"], assigneeId: string | null, dueDate: string | null, sprintId: string | null = null) =>
    db.save(db.create(Task, { projectId, title, status, assigneeId, dueDate, sprintId, priority: "medium" }));
  // Delta: 4 tareas, 1 terminada (25 %), 1 vencida, 1 sin responsable; 50 % del tiempo transcurrido.
  await task(delta.id, "D1 hecha", "done", s.member.id, null, sprint.id);
  await task(delta.id, "D2 vencida", "in_progress", s.member.id, day(-2), sprint.id);
  await task(delta.id, "D3 por vencer", "todo", s.member.id, day(4));
  await task(delta.id, "D4 sin responsable", "todo", null, day(20));
  await task(zeta.id, "Z1 vencida de pausado", "todo", s.outsider.id, day(-3));
  // Epsilon sin movimiento en 30 dias: la fecha cruda de SQLite tambien prueba instant().
  await h.dataSource.query("UPDATE projects SET updated_at = ? WHERE id = ?", [new Date(now.getTime() - 30 * 86_400_000).toISOString().replace("T", " ").replace("Z", ""), epsilon.id]);

  const pendingUser = await h.createUser("panel-solicitud@uniguajira.edu.co", { status: "pending" });
  await db.save(db.create(MembershipRequest, { userId: pendingUser.id, status: "pending", message: null, cvData: null }));
  const request = (status: AdministrativeRequest["status"]) => db.create(AdministrativeRequest, {
    requesterId: s.member.id, type: "general", subject: `Tramite ${status}`, description: "Descripcion ficticia del tramite", status,
    reviewerId: null, response: null, reviewedBy: null, reviewedAt: null, completedBy: null, completedAt: null,
  });
  await db.save([request("pending"), request("pending"), request("in_review"), request("completed")]);

  const event = (title: string, status: EventRecord["status"], projectId: string | null, offsetDays: number) => {
    const at = now.getTime() + offsetDays * 86_400_000, startsAt = new Date(at).toISOString(), endsAt = new Date(at + 3_600_000).toISOString();
    return db.save(db.create(EventRecord, { title, type: "meeting", status, mode: "online", url: "https://example.org/sala", startsAt, endsAt, organizerId: s.coord.id, projectId }));
  };
  const meeting = await event("Reunion de Delta", "scheduled", delta.id, 3);
  await db.save(EventParticipant, { eventId: meeting.id, userId: s.member.id, role: "participant", attendance: "registered" });
  await event("Encuentro institucional", "scheduled", null, 6);
  await event("Pasada", "scheduled", null, -2);
  await event("Cancelada futura", "cancelled", null, 4);

  await db.save(db.create(ProjectObservation, { projectId: delta.id, authorId: s.teacher.id, kind: "progress", body: "Avance: se completo la revision de literatura." }));
  await db.save(db.create(ProjectObservation, { projectId: zeta.id, authorId: s.outsider.id, kind: "difficulty", body: `Dificultad privada de Zeta ${"x".repeat(300)}` }));
  await db.save(db.create(AcademicProduct, { title: "Articulo de Delta", type: "article", status: "submitted", projectId: delta.id }));
});
after(async () => { await h?.close(); });

describe("I-26: reglas del panel", () => {
  it("tiempo transcurrido acotado y sin fechas validas", () => {
    assert.equal(elapsed("2026-01-01", "2026-01-11", "2026-01-06"), 50);
    assert.equal(elapsed("2026-01-01", "2026-01-11", "2025-12-01"), 0);
    assert.equal(elapsed("2026-01-01", "2026-01-11", "2026-03-01"), 100);
    assert.equal(elapsed(null, "2026-01-11", "2026-01-06"), null);
    assert.equal(elapsed("2026-01-11", "2026-01-11", "2026-01-11"), null);
  });
  it("fechas crudas de SQLite y PostgreSQL", () => {
    assert.equal(instant("2026-10-23 12:30:00.000")!.toISOString(), "2026-10-23T12:30:00.000Z");
    assert.equal(instant("2026-10-23T12:30:00.000Z")!.toISOString(), "2026-10-23T12:30:00.000Z");
    assert.equal(instant(new Date("2026-10-23T12:30:00Z"))!.toISOString(), "2026-10-23T12:30:00.000Z");
    assert.equal(instant(null), null);
  });
  it("alertas solo en proyectos activos; atraso desde 25 puntos", () => {
    const cutoff = new Date("2026-10-23T15:00:00Z"), today = "2026-10-23", recent = new Date("2026-10-20T00:00:00Z");
    const base = { status: "active", endDate: "2026-12-01", overdue: 0, progress: 50, elapsed: 74, lastActivityAt: recent };
    assert.deepEqual(risks(base, today, cutoff), []);
    assert.deepEqual(risks({ ...base, elapsed: 75 }, today, cutoff), ["behind_schedule"]);
    assert.deepEqual(risks({ ...base, progress: null, elapsed: 100 }, today, cutoff), []);
    assert.deepEqual(risks({ ...base, overdue: 2, endDate: "2026-10-22", lastActivityAt: new Date("2026-10-01T00:00:00Z") }, today, cutoff), ["overdue_tasks", "past_end_date", "inactive"]);
    assert.deepEqual(risks({ ...base, lastActivityAt: null }, today, cutoff), ["inactive"]);
    assert.deepEqual(risks({ ...base, status: "paused", overdue: 3, endDate: "2026-01-01", lastActivityAt: null }, today, cutoff), []);
  });
});

describe("I-26: panel del semillero (G-01 a G-07)", () => {
  it("proyectos en curso por etapa con avance, sprint, lideres, tiempo y alertas", async () => {
    const r = await get(s.coord, "/tracking/overview");
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.ok(Date.parse(d.cutoff));
    assert.equal(d.projects.total, 4);
    assert.deepEqual(d.projects.items.map((p: { name: string }) => p.name), ["Delta", "Epsilon", "Zeta", "Eta"]); // Theta finalizado no se lista
    const [delta, epsilon, zeta, eta] = d.projects.items;
    assert.deepEqual(delta.tasks, { total: 4, done: 1, progress: 25 });
    assert.equal(delta.overdue, 1); assert.equal(delta.elapsed, 50);
    assert.deepEqual(delta.leaders, [{ id: s.teacher.id, fullName: "Docente Ficticio" }]);
    assert.deepEqual(delta.sprint, { id: ids.sprint, name: "Sprint 3", endDate: bogotaDay(new Date(), 9), tasks: { total: 2, done: 1, progress: 50 } });
    assert.deepEqual(delta.risks, ["overdue_tasks", "behind_schedule"]);
    assert.ok(Date.now() - Date.parse(delta.lastActivityAt) < 3_600_000);
    assert.deepEqual(epsilon.tasks, { total: 0, done: 0, progress: null });
    assert.equal(epsilon.elapsed, 100); assert.equal(epsilon.sprint, null);
    assert.deepEqual(epsilon.risks, ["past_end_date", "inactive"]);
    assert.equal(zeta.overdue, 1); assert.deepEqual(zeta.risks, []); // pausado: sin alertas
    assert.equal(eta.elapsed, null); assert.deepEqual(eta.leaders, []);
  });
  it("pendientes de gestion, agenda y actividad reciente", async () => {
    const d = (await get(s.coord, "/tracking/overview")).json;
    assert.deepEqual(d.pending, { membershipRequests: 1, administrativeRequests: { pending: 2, inReview: 1 } });
    assert.deepEqual(d.agenda.map((e: { title: string }) => e.title), ["Reunion de Delta", "Encuentro institucional"]);
    assert.deepEqual(d.agenda[0].project, { id: ids.delta, name: "Delta" }); assert.equal(d.agenda[1].project, null);
    assert.equal(d.recent.observations.length, 2);
    const zeta = d.recent.observations.find((o: { project: { name: string } }) => o.project.name === "Zeta");
    assert.equal(zeta.excerpt.length, 200); assert.ok(zeta.excerpt.endsWith("…")); assert.equal(zeta.author, "Estudiante Ajeno");
    assert.deepEqual(d.recent.products.map((p: { title: string; project: { name: string } }) => [p.title, p.project.name]), [["Articulo de Delta", "Delta"]]);
  });
  it("solo autoridades: estudiantes y docente lider reciben 403; sin sesion 401", async () => {
    for (const who of [s.member, s.teacher, s.outsider]) {
      const r = await get(who, "/tracking/overview");
      assert.equal(r.response.status, 403, r.text);
      assert.equal(r.text.includes("Delta"), false);
    }
    assert.equal((await h.request("/tracking/overview")).response.status, 401);
  });
});

describe("I-26: panel personal ampliado (M-07 a M-10)", () => {
  it("integrante: tarjeta del proyecto, por vencer, tareas por estado y observaciones de sus proyectos", async () => {
    const r = await get(s.member, "/tracking/me");
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.deepEqual(d.projects.items, [{
      id: ids.delta, name: "Delta", status: "active", role: "collaborator", tasks: { total: 4, done: 1, progress: 25 }, overdue: 1, unassigned: 1, myOpen: 2,
      sprint: { id: ids.sprint, name: "Sprint 3", endDate: bogotaDay(new Date(), 9), tasks: { total: 2, done: 1, progress: 50 } },
      leaders: [{ id: s.teacher.id, fullName: "Docente Ficticio" }],
    }]);
    assert.deepEqual(d.events.upcoming.map((e: { title: string; projectName: string | null }) => [e.title, e.projectName]), [["Reunion de Delta", "Delta"]]);
    assert.equal(d.tasks.dueSoon, 1); // D3; D2 ya vencio y D4 vence en 20 dias
    assert.deepEqual(d.tasks.byStatus, { todo: 1, in_progress: 1, in_review: 0, done: 1 });
    assert.deepEqual(d.observations.map((o: { project: { name: string } }) => o.project.name), ["Delta"]);
    assert.equal(d.observations[0].author, "Docente Ficticio");
    for (const hidden of ["Zeta", "privada"]) assert.equal(r.text.includes(hidden), false, hidden);
  });
  it("docente lider: su proyecto liderado sin tareas propias; autoridad sin equipos sin tarjetas", async () => {
    const teacher = (await get(s.teacher, "/tracking/me")).json;
    assert.equal(teacher.projects.items[0].role, "leader"); assert.equal(teacher.projects.items[0].myOpen, 0); assert.equal(teacher.projects.items[0].unassigned, 1);
    assert.equal(teacher.tasks.dueSoon, 0);
    const outsider = (await get(s.outsider, "/tracking/me")).json;
    assert.deepEqual(outsider.projects.items.map((p: { name: string; sprint: unknown }) => [p.name, p.sprint]), [["Zeta", null]]);
    assert.deepEqual(outsider.observations.map((o: { project: { name: string } }) => o.project.name), ["Zeta"]);
    const coord = (await get(s.coord, "/tracking/me")).json;
    assert.deepEqual(coord.projects.items, []); assert.deepEqual(coord.observations, []);
  });
});

describe("I-27: lista de proyectos con indicadores (G-01 a G-04 por proyecto)", () => {
  const names = (r: { json: { items: { name: string }[] } }) => r.json.items.map((p) => p.name);
  it("resumen del conjunto visible, independiente de filtros y pagina", async () => {
    const r = await get(s.coord, "/projects?status=paused&pageSize=1");
    assert.equal(r.response.status, 200, r.text);
    assert.deepEqual(r.json.summary, {
      total: 5, byStatus: { proposed: 1, planning: 0, active: 2, paused: 1, completed: 1, cancelled: 0 }, atRisk: 2,
      tasks: { total: 5, done: 1, progress: 20 },
    });
    assert.equal(r.json.total, 1); assert.deepEqual(names(r), ["Zeta"]);
  });
  it("cada proyecto trae vencidas, sprint, tiempo, ultima actividad y alertas", async () => {
    const r = await get(s.coord, "/projects?q=delta");
    const [delta] = r.json.items;
    assert.equal(delta.overdue, 1); assert.equal(delta.elapsed, 50); assert.equal(delta.unassigned, 1);
    assert.deepEqual(delta.risks, ["overdue_tasks", "behind_schedule"]);
    assert.deepEqual(delta.sprint, { id: ids.sprint, name: "Sprint 3", endDate: bogotaDay(new Date(), 9), tasks: { total: 2, done: 1, progress: 50 } });
    assert.ok(Date.now() - Date.parse(delta.lastActivityAt) < 3_600_000);
    assert.equal(delta.progress.total, 4); assert.equal(delta.memberCount, 2);
  });
  it("solo con alertas filtra el listado pero no el resumen", async () => {
    for (const flag of ["true", "1"]) {
      const r = await get(s.coord, `/projects?alerts=${flag}`);
      assert.deepEqual(names(r), ["Delta", "Epsilon"]); assert.equal(r.json.total, 2); assert.equal(r.json.summary.total, 5);
    }
    assert.equal((await get(s.coord, "/projects?alerts=quiza")).response.status, 400);
  });
  it("ordena por nombre, avance, fecha de fin y actividad con los proyectos sin dato al final", async () => {
    assert.deepEqual(names(await get(s.coord, "/projects?sort=name")), ["Delta", "Epsilon", "Eta", "Theta", "Zeta"]);
    assert.deepEqual(names(await get(s.coord, "/projects?sort=progress")), ["Delta", "Zeta", "Epsilon", "Eta", "Theta"]); // Zeta: 0 %; sin tareas, al final
    assert.deepEqual(names(await get(s.coord, "/projects?sort=end_date")), ["Zeta", "Epsilon", "Delta", "Eta", "Theta"]);
    const byActivity = names(await get(s.coord, "/projects?sort=activity"));
    assert.equal(byActivity[0], "Delta"); assert.equal(byActivity.at(-1), "Epsilon"); // Epsilon lleva 30 dias sin movimiento
    assert.equal((await get(s.coord, "/projects?sort=popularidad")).response.status, 400);
  });
  it("busca por nombre o por lider y pagina sobre el conjunto filtrado", async () => {
    assert.deepEqual(names(await get(s.coord, "/projects?q=docente")), ["Delta"]);
    assert.deepEqual(names(await get(s.coord, "/projects?q=%25")), []); // el comodin es literal
    const second = await get(s.coord, "/projects?sort=name&pageSize=2&page=2");
    assert.deepEqual(names(second), ["Eta", "Theta"]); assert.equal(second.json.total, 5);
  });
  it("cada persona solo cuenta y ve sus proyectos", async () => {
    const member = await get(s.member, "/projects");
    assert.deepEqual(names(member), ["Delta"]);
    assert.equal(member.json.summary.total, 1); assert.deepEqual(member.json.summary.tasks, { total: 4, done: 1, progress: 25 });
    assert.equal(member.json.items[0].myRole, "collaborator"); assert.equal(member.json.items[0].myOpen, 2);
    const outsider = await get(s.outsider, "/projects");
    assert.deepEqual(names(outsider), ["Zeta"]); assert.equal(outsider.json.summary.atRisk, 0); // pausado: sin alertas
    for (const who of [member, outsider]) assert.equal(JSON.stringify(who.json).includes("Epsilon"), false);
    assert.equal((await h.request("/projects")).response.status, 401);
  });
});

describe("I-27: panel de proyecto ampliado para la pagina de detalle", () => {
  it("alertas, tiempo, ultima actividad y mis tareas abiertas por fecha limite", async () => {
    const r = await get(s.member, `/tracking/projects/${ids.delta}`);
    assert.equal(r.response.status, 200, r.text);
    const d = r.json;
    assert.deepEqual(d.signals.risks, ["overdue_tasks", "behind_schedule"]);
    assert.equal(d.signals.elapsed, 50); assert.ok(Date.now() - Date.parse(d.signals.lastActivityAt) < 3_600_000);
    assert.equal(d.myTasks.open, 2);
    assert.deepEqual(d.myTasks.items.map((t: { title: string }) => t.title), ["D2 vencida", "D3 por vencer"]);
    assert.deepEqual(Object.keys(d.myTasks.items[0]).sort(), ["dueDate", "id", "priority", "status", "title"]);
    assert.equal(d.myTasks.items[0].priority, "medium");
  });
  it("sin tareas propias la lista va vacia y los proyectos no activos no tienen alertas", async () => {
    const leader = (await get(s.teacher, `/tracking/projects/${ids.delta}`)).json;
    assert.deepEqual(leader.myTasks, { open: 0, items: [] });
    const paused = (await get(s.coord, `/tracking/projects/${ids.zeta}`)).json;
    assert.deepEqual(paused.signals.risks, []); assert.deepEqual(paused.myTasks, { open: 0, items: [] });
    assert.equal((await get(s.outsider, `/tracking/projects/${ids.delta}`)).response.status, 404);
  });
});
