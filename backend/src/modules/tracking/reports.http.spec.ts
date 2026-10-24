import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { startHttpHarness, type HttpHarness } from "../../testing/http-harness";
import { AcademicProduct, ProductAuthor } from "../academic/academic.entities";
import { AuditEvent } from "../audit/audit-event.entity";
import { EventParticipant, EventRecord } from "../events/event.entities";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { ProjectResearchLine, ResearchLine } from "../research/research.entities";
import { Task } from "../tasks/task.entity";

// F6-07: fixture con resultados conocidos, contados a mano, para reportes (F6-06) y observaciones (F6-05).
type Session = { cookies: string[]; csrf: string; id: string };
let h: HttpHarness, counter = 0;
const s: Record<"coord" | "teacher" | "leader" | "member" | "outsider", Session> = {} as never;
const ids: Record<string, string> = {};
const call = (who: Session, path: string, method = "GET", body?: unknown) => h.request(path, { method, body, cookies: who.cookies, csrf: who.csrf });
const names = (items: { name?: string; title?: string }[]) => items.map(i => i.name ?? i.title);
async function person(role: "coordinator" | "teacher_leader" | "student") {
  const email = `reportes-${++counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles: [role] });
  return { ...await h.loginOk(email), id: user.id };
}

before(async () => {
  h = await startHttpHarness();
  const db = h.dataSource.manager;
  s.coord = await person("coordinator"); s.teacher = await person("teacher_leader");
  s.leader = await person("student"); s.member = await person("student"); s.outsider = await person("student");
  const line = (name: string) => db.save(db.create(ResearchLine, { name, nameNormalized: name.toLowerCase(), status: "active" }));
  const software = await line("Ingenieria de software"), ai = await line("Inteligencia artificial");
  ids.software = software.id; ids.ai = ai.id;
  const project = (name: string, type: Project["type"], status: Project["status"], startDate: string | null, endDate: string | null) =>
    db.save(db.create(Project, { name, type, methodology: "traditional", status, startDate, endDate }));
  const alfa = await project("Alfa", "research", "active", "2026-01-10", "2026-06-30");
  const beta = await project("Beta", "software", "completed", "2025-03-01", "2025-12-15");
  const gamma = await project("Gamma", "research", "proposed", null, null);
  const delta = await project("Delta", "innovation", "active", "2026-05-01", null);
  Object.assign(ids, { alfa: alfa.id, beta: beta.id, gamma: gamma.id, delta: delta.id });
  await db.save(ProjectResearchLine, [
    { projectId: alfa.id, researchLineId: software.id }, { projectId: beta.id, researchLineId: software.id },
    { projectId: beta.id, researchLineId: ai.id }, { projectId: delta.id, researchLineId: ai.id },
  ]);
  await db.save(ProjectMember, [{ projectId: alfa.id, userId: s.leader.id, role: "leader" }, { projectId: alfa.id, userId: s.member.id, role: "collaborator" }]);
  const task = (projectId: string, status: Task["status"]) => db.save(db.create(Task, { projectId, title: `Tarea ${++counter}`, status, priority: "medium" }));
  for (const [projectId, status] of [[alfa.id, "done"], [alfa.id, "done"], [alfa.id, "todo"], [beta.id, "done"], [beta.id, "done"], [delta.id, "todo"]] as const) await task(projectId, status);

  const product = async (title: string, type: AcademicProduct["type"], status: AcademicProduct["status"], projectId: string | null, productDate: string | null, authors: number) => {
    const row = await db.save(db.create(AcademicProduct, { title, type, status, projectId, productDate }));
    await db.save(ProductAuthor, Array.from({ length: authors }, (_, i) => ({ productId: row.id, position: i + 1, userId: null, externalName: `Autoria externa ${i + 1}` })));
  };
  await product("A1", "article", "published", alfa.id, "2026-03-15", 2);
  await product("A2", "poster", "in_progress", null, null, 1);
  await product("A3", "software", "accepted", beta.id, "2025-11-30", 1);
  await product("A4", "article", "submitted", delta.id, "2026-12-31", 1);
  await product("A5", "article", "published", alfa.id, "2026-01-01", 1);

  const event = (title: string, type: EventRecord["type"], status: EventRecord["status"], projectId: string | null, startsAt: string) =>
    db.save(db.create(EventRecord, { title, type, status, mode: "online", url: "https://example.org/sala", startsAt, endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(), organizerId: s.coord.id, projectId }));
  // E1 inicia el 1 de marzo a las 23:30 en Bogota; E2, el 2 de marzo a las 00:00.
  const e1 = await event("E1", "meeting", "completed", alfa.id, "2026-03-02T04:30:00.000Z");
  const e2 = await event("E2", "training", "completed", null, "2026-03-02T05:00:00.000Z");
  const e3 = await event("E3", "academic", "scheduled", beta.id, "2026-04-10T15:00:00.000Z");
  await event("E4", "meeting", "cancelled", delta.id, "2026-02-01T15:00:00.000Z");
  const p = (eventId: string, userId: string, attendance: EventParticipant["attendance"]) => ({ eventId, userId, role: "participant" as const, attendance });
  await db.save(EventParticipant, [p(e1.id, s.member.id, "attended"), p(e1.id, s.leader.id, "attended"), p(e2.id, s.member.id, "attended"), p(e2.id, s.outsider.id, "absent"), p(e3.id, s.member.id, "registered")]);
});
after(async () => { await h?.close(); });

describe("I-24: reporte de proyectos (R-01)", () => {
  it("sin filtros: todas las filas, resumen del conjunto y detalle por proyecto", async () => {
    const r = await call(s.coord, "/tracking/reports/projects");
    assert.equal(r.response.status, 200, r.text);
    assert.deepEqual(names(r.json.items), ["Alfa", "Beta", "Delta", "Gamma"]);
    assert.deepEqual(r.json.summary, { total: 4, byStatus: { proposed: 1, planning: 0, active: 2, paused: 0, completed: 1, cancelled: 0 }, tasks: { total: 6, done: 4, progress: 67 } });
    const alfa = r.json.items[0];
    assert.deepEqual(alfa.lines, ["Ingenieria de software"]);
    assert.deepEqual(alfa.tasks, { total: 3, done: 2, progress: 67 });
    assert.deepEqual([alfa.products, alfa.researchResults, alfa.events], [2, 0, 1]);
    assert.deepEqual(r.json.items[3].tasks, { total: 0, done: 0, progress: null });
    // Coherencia con el panel institucional sobre la misma base.
    assert.deepEqual((await call(s.coord, "/tracking/institutional")).json.projects.byStatus, r.json.summary.byStatus);
  });
  it("rango de fechas por cruce del periodo planificado, con limites inclusivos", async () => {
    const q = (query: string) => call(s.coord, `/tracking/reports/projects?${query}`).then(r => r.json);
    const year = await q("from=2026-01-01&to=2026-12-31");
    assert.deepEqual(names(year.items), ["Alfa", "Delta"]); // Beta termino antes; Gamma no tiene fechas
    assert.deepEqual(year.summary.tasks, { total: 4, done: 2, progress: 50 });
    assert.deepEqual(names((await q("from=2025-12-15&to=2025-12-15")).items), ["Beta"]);
    assert.deepEqual(names((await q("from=2025-12-16&to=2026-01-09")).items), []);
    assert.equal((await q("from=2025-12-16&to=2026-01-09")).summary.tasks.progress, null);
  });
  it("tipo, estado, linea y paginacion sin alterar el resumen", async () => {
    const q = (query: string) => call(s.coord, `/tracking/reports/projects?${query}`).then(r => r.json);
    assert.deepEqual(names((await q(`researchLineId=${ids.ai}`)).items), ["Beta", "Delta"]);
    assert.deepEqual(names((await q("type=research")).items), ["Alfa", "Gamma"]);
    assert.deepEqual(names((await q("type=innovation&status=active")).items), ["Delta"]);
    const page = await q("page=2&pageSize=2");
    assert.deepEqual(names(page.items), ["Delta", "Gamma"]);
    assert.equal(page.total, 4); assert.equal(page.summary.total, 4); assert.equal(page.summary.tasks.total, 6);
  });
});

describe("I-24: reporte de produccion (R-02)", () => {
  it("orden por fecha, resumen por estado y tipo, autores de la fila", async () => {
    const r = await call(s.coord, "/tracking/reports/products");
    assert.equal(r.response.status, 200, r.text);
    assert.deepEqual(names(r.json.items), ["A4", "A1", "A5", "A3", "A2"]);
    assert.deepEqual(r.json.summary.byStatus, { in_progress: 1, submitted: 1, accepted: 1, published: 2, rejected: 0 });
    assert.equal(r.json.summary.byType.article, 3); assert.equal(r.json.summary.byType.poster, 1); assert.equal(r.json.summary.total, 5);
    assert.equal(r.json.items[1].authors, 2); assert.equal(r.json.items[1].project.name, "Alfa"); assert.equal(r.json.items[4].project, null);
  });
  it("fechas inclusivas, linea, tipo de proyecto, tipo y estado", async () => {
    const q = (query: string) => call(s.coord, `/tracking/reports/products?${query}`).then(r => r.json);
    assert.deepEqual(names((await q("from=2026-01-01&to=2026-12-31")).items), ["A4", "A1", "A5"]); // A2 sin fecha se excluye
    assert.deepEqual(names((await q(`researchLineId=${ids.software}`)).items), ["A1", "A5", "A3"]);
    assert.deepEqual(names((await q("projectType=research")).items), ["A1", "A5"]);
    const published = await q("type=article&status=published");
    assert.deepEqual(names(published.items), ["A1", "A5"]); assert.equal(published.summary.byStatus.published, 2); assert.equal(published.summary.byStatus.submitted, 0);
  });
});

describe("I-24: reporte de actividades (R-03)", () => {
  it("resumen con asistencias y conteos por fila", async () => {
    const r = await call(s.coord, "/tracking/reports/events");
    assert.equal(r.response.status, 200, r.text);
    assert.deepEqual(names(r.json.items), ["E3", "E2", "E1", "E4"]);
    assert.deepEqual(r.json.summary, { total: 4, byStatus: { scheduled: 1, in_progress: 0, completed: 2, cancelled: 1 }, attended: 3 });
    const e1 = r.json.items[2];
    assert.deepEqual([e1.participants, e1.attended, e1.project.name], [2, 2, "Alfa"]);
  });
  it("el dia se interpreta en Bogota y la linea excluye actividades institucionales", async () => {
    const q = (query: string) => call(s.coord, `/tracking/reports/events?${query}`).then(r => r.json);
    assert.deepEqual(names((await q("from=2026-03-01&to=2026-03-01")).items), ["E1"]);
    assert.deepEqual(names((await q("from=2026-03-02&to=2026-03-02")).items), ["E2"]);
    const line = await q(`researchLineId=${ids.ai}`);
    assert.deepEqual(names(line.items), ["E3", "E4"]); assert.equal(line.summary.attended, 0);
    assert.equal((await q("status=completed")).summary.attended, 3);
  });
});

describe("I-24: validacion y permisos de reportes", () => {
  it("fechas imposibles, rango invertido y valores desconocidos responden 400", async () => {
    for (const query of ["from=2026-02-30", "from=2026-05-01&to=2026-04-30", "type=inventado", "status=x", "researchLineId=no-uuid", "pageSize=101", "from=01-05-2026"])
      assert.equal((await call(s.coord, `/tracking/reports/projects?${query}`)).response.status, 400, query);
    assert.equal((await call(s.coord, "/tracking/reports/products?projectType=x")).response.status, 400);
  });
  it("solo autoridades: 403 para integrantes y docente lider; 401 sin sesion", async () => {
    for (const kind of ["projects", "products", "events"]) {
      for (const who of [s.leader, s.member, s.teacher, s.outsider]) {
        const r = await call(who, `/tracking/reports/${kind}`);
        assert.equal(r.response.status, 403, `${kind}: ${r.text}`); assert.equal(r.text.includes("summary"), false);
      }
      assert.equal((await h.request(`/tracking/reports/${kind}`)).response.status, 401);
    }
  });
});

describe("I-24: observaciones de seguimiento (F6-05)", () => {
  const path = () => `/projects/${ids.alfa}/observations`;
  it("lider y autoridad registran; colaborador consulta sin poder registrar; persona ajena no ve el proyecto", async () => {
    const leader = await call(s.leader, path(), "POST", { kind: "progress", body: "Se completo el prototipo inicial del modulo." });
    assert.equal(leader.response.status, 201, leader.text); ids.leaderObs = leader.json.id;
    const coord = await call(s.coord, path(), "POST", { kind: "difficulty", body: "Retraso por disponibilidad del laboratorio." });
    assert.equal(coord.response.status, 201, coord.text); ids.coordObs = coord.json.id;
    assert.equal((await call(s.member, path(), "POST", { kind: "general", body: "Intento sin permiso de registro." })).response.status, 403);
    const list = await call(s.member, path());
    assert.equal(list.response.status, 200, list.text);
    assert.equal(list.json.total, 2); assert.equal(list.json.permissions.canCreate, false);
    assert.deepEqual(list.json.items.map((o: { kind: string }) => o.kind).sort(), ["difficulty", "progress"]);
    assert.ok(list.json.items.every((o: { permissions: { canDelete: boolean }; author: { fullName: string } }) => !o.permissions.canDelete && o.author.fullName));
    for (const method of ["GET", "POST"]) assert.equal((await call(s.outsider, path(), method, method === "POST" ? { kind: "general", body: "Intento de persona ajena." } : undefined)).response.status, 404);
  });
  it("valida tipo, longitud y rechaza campos de evaluacion personal", async () => {
    for (const body of [{ kind: "progress", body: "corto" }, { kind: "rating", body: "Texto suficientemente largo." }, { kind: "progress", body: "Texto suficientemente largo.", userId: s.member.id }, { kind: "progress", body: "Texto suficientemente largo.", score: 5 }, { kind: "progress", body: "x".repeat(5001) }])
      assert.equal((await call(s.coord, path(), "POST", body)).response.status, 400, JSON.stringify(body).slice(0, 80));
  });
  it("elimina el autor o una autoridad, con auditoria; proyecto finalizado en solo lectura", async () => {
    assert.equal((await call(s.leader, `${path()}/${ids.coordObs}`, "DELETE")).response.status, 403);
    assert.equal((await call(s.coord, `${path()}/${ids.leaderObs}`, "DELETE")).response.status, 204);
    assert.equal((await call(s.leader, `${path()}/${ids.coordObs}`, "DELETE")).response.status, 403);
    assert.equal((await call(s.coord, `${path()}/${ids.leaderObs}`, "DELETE")).response.status, 404);
    const audits = await h.dataSource.manager.findBy(AuditEvent, { targetId: ids.alfa });
    assert.deepEqual(audits.map(a => a.action).filter(a => a.startsWith("project_observation")).sort(), ["project_observation.created", "project_observation.created", "project_observation.deleted"]);
    assert.equal((await call(s.coord, `/projects/${ids.beta}/observations`, "POST", { kind: "result", body: "Cierre del proyecto finalizado." })).response.status, 409);
    assert.equal((await call(s.coord, `/projects/${ids.beta}/observations`)).json.permissions.canCreate, false);
  });
});
