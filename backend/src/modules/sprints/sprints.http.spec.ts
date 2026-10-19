import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { type HttpHarness, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import type { RoleCode } from "../roles/role.entity";

let h: HttpHarness;
let counter = 0;

type Session = { cookies: string[]; csrf: string; id: string };

async function person(roles: RoleCode[]): Promise<Session> {
  counter += 1;
  const email = `sprint-${counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles });
  return { ...(await h.loginOk(email)), id: user.id };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

async function ok(session: Session, method: string, path: string, body?: unknown) {
  const result = await send(session, method, path, body);
  assert.ok(result.response.status < 300, `${method} ${path}: ${result.response.status} ${result.text}`);
  return result.json;
}

/** Proyecto de la coordinacion con un lider (estudiante) y un colaborador. */
async function team(methodology: "agile" | "traditional" = "agile") {
  const coordinator = await person(["coordinator"]);
  const leader = await person(["student"]);
  const collaborator = await person(["student"]);
  const project = await ok(coordinator, "POST", "/projects", { name: "Proyecto con sprints", type: "software", methodology });
  await ok(coordinator, "POST", `/projects/${project.id}/members`, { userId: leader.id, role: "leader" });
  await ok(coordinator, "POST", `/projects/${project.id}/members`, { userId: collaborator.id, role: "collaborator" });
  return { coordinator, leader, collaborator, projectId: project.id as string };
}

function newSprint(session: Session, projectId: string, extra: Record<string, unknown> = {}) {
  return ok(session, "POST", `/projects/${projectId}/sprints`, {
    name: "Sprint 1",
    startDate: "2026-11-02",
    endDate: "2026-11-13",
    ...extra,
  });
}

function newTask(session: Session, projectId: string, body: Record<string, unknown> = {}) {
  return ok(session, "POST", `/projects/${projectId}/tasks`, { title: "Tarea ficticia", ...body });
}

before(async () => {
  h = await startHttpHarness();
});

after(async () => {
  await h?.close();
});

describe("modalidad tradicional (prueba F2-1)", () => {
  it("no admite sprints por API y sus tareas funcionan sin ellos", async () => {
    const { coordinator, projectId } = await team("traditional");
    const task = await newTask(coordinator, projectId);

    const create = await send(coordinator, "POST", `/projects/${projectId}/sprints`, {
      name: "Sprint",
      startDate: "2026-11-02",
      endDate: "2026-11-13",
    });
    const list = await h.request(`/projects/${projectId}/sprints`, { cookies: coordinator.cookies });
    const move = await send(coordinator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status: "done" });

    assert.equal(create.response.status, 409);
    assert.equal(create.json.code, "PROJECT_NOT_AGILE");
    assert.deepEqual(list.json.items, []);
    assert.equal(list.json.permissions.canCreateSprints, false);
    assert.equal(move.response.status, 200);
  });
});

describe("crear y planificar (F2-13, F2-15, pruebas F2-2 y F2-3)", () => {
  it("el lider crea un sprint planificado y agrega tareas del backlog", async () => {
    const { leader, projectId } = await team();
    const a = await newTask(leader, projectId);
    const b = await newTask(leader, projectId);
    const sprint = await newSprint(leader, projectId, { goal: "Primer incremento" });
    assert.equal(sprint.status, "planned");

    const planned = await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [a.id, b.id] });
    const backlog = await h.request(`/projects/${projectId}/tasks?sprintId=none`, { cookies: leader.cookies });
    const inSprint = await h.request(`/projects/${projectId}/tasks?sprintId=${sprint.id}`, { cookies: leader.cookies });

    assert.deepEqual(planned.tasks.map((task: { id: string }) => task.id).sort(), [a.id, b.id].sort());
    assert.equal(backlog.json.total, 0);
    assert.equal(inSprint.json.total, 2);
  });

  it("valida fechas reales y en orden", async () => {
    const { leader, projectId } = await team();

    for (const body of [
      { name: "Sprint", startDate: "2026-11-13", endDate: "2026-11-02" },
      { name: "Sprint", startDate: "2026-02-30", endDate: "2026-03-10" },
      { name: "S", startDate: "2026-11-02", endDate: "2026-11-13" },
      { name: "Sprint", startDate: "2026-11-02" },
    ]) {
      const { response } = await send(leader, "POST", `/projects/${projectId}/sprints`, body);
      assert.equal(response.status, 400, JSON.stringify(body));
    }
  });

  it("una tarea de otro proyecto no entra al sprint (prueba F2-5), ni por la base de datos", async () => {
    const a = await team();
    const b = await team();
    const foreign = await newTask(b.coordinator, b.projectId);
    const sprint = await newSprint(a.coordinator, a.projectId);

    const viaApi = await send(a.coordinator, "POST", `/projects/${a.projectId}/sprints/${sprint.id}/tasks`, { taskIds: [foreign.id] });
    assert.equal(viaApi.response.status, 404);

    // La clave foranea compuesta (sprint_id, project_id) lo impide aunque se salte la API.
    await assert.rejects(
      h.dataSource.query("UPDATE tasks SET sprint_id = ? WHERE id = ?", [sprint.id, foreign.id]),
      /FOREIGN KEY constraint failed/,
    );
  });

  it("una tarea que ya esta en un sprint no se agrega a otro", async () => {
    const { leader, projectId } = await team();
    const task = await newTask(leader, projectId);
    const first = await newSprint(leader, projectId);
    const second = await newSprint(leader, projectId, { name: "Sprint 2" });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${first.id}/tasks`, { taskIds: [task.id] });

    const again = await send(leader, "POST", `/projects/${projectId}/sprints/${second.id}/tasks`, { taskIds: [task.id] });

    assert.equal(again.response.status, 409);
    assert.equal(again.json.code, "TASK_NOT_IN_BACKLOG");
  });

  it("quitar una tarea la devuelve al backlog; solo se edita un sprint planificado", async () => {
    const { leader, projectId } = await team();
    const task = await newTask(leader, projectId);
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [task.id] });

    const removed = await ok(leader, "DELETE", `/projects/${projectId}/sprints/${sprint.id}/tasks/${task.id}`);
    const edited = await ok(leader, "PATCH", `/projects/${projectId}/sprints/${sprint.id}`, { name: "Sprint renombrado", goal: null });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    const editActive = await send(leader, "PATCH", `/projects/${projectId}/sprints/${sprint.id}`, { name: "Otro" });

    assert.deepEqual(removed.tasks, []);
    assert.equal(edited.name, "Sprint renombrado");
    assert.equal(edited.goal, null);
    assert.equal(editActive.json.code, "SPRINT_NOT_EDITABLE");
  });
});

describe("un sprint activo por proyecto (F2-14, F2-16, prueba F2-4)", () => {
  it("rechaza iniciar un segundo sprint mientras otro esta activo", async () => {
    const { leader, projectId } = await team();
    const first = await newSprint(leader, projectId);
    const second = await newSprint(leader, projectId, { name: "Sprint 2" });

    const started = await ok(leader, "POST", `/projects/${projectId}/sprints/${first.id}/start`);
    const blocked = await send(leader, "POST", `/projects/${projectId}/sprints/${second.id}/start`);
    const restart = await send(leader, "POST", `/projects/${projectId}/sprints/${first.id}/start`);

    assert.equal(started.status, "active");
    assert.ok(started.startedAt);
    assert.equal(blocked.json.code, "SPRINT_ALREADY_ACTIVE");
    assert.equal(restart.json.code, "INVALID_SPRINT_TRANSITION");
  });

  it("con inicios simultaneos solo uno queda activo", async () => {
    const { leader, projectId } = await team();
    const sprints = await Promise.all([1, 2, 3, 4].map((n) => newSprint(leader, projectId, { name: `Sprint ${n}` })));

    const results = await Promise.all(sprints.map((sprint) => send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`)));
    const statuses = results.map((result) => result.response.status).sort();
    const active = await h.dataSource.query("SELECT COUNT(*) AS n FROM sprints WHERE project_id = ? AND status = 'active'", [projectId]);

    assert.deepEqual(statuses, [200, 409, 409, 409]);
    assert.ok(results.filter((result) => result.response.status === 409).every((result) => result.json.code === "SPRINT_ALREADY_ACTIVE"));
    assert.equal(Number(active[0].n), 1);
  });

  it("la base de datos impide dos activos aunque se salte la API", async () => {
    const { leader, projectId } = await team();
    const first = await newSprint(leader, projectId);
    const second = await newSprint(leader, projectId, { name: "Sprint 2" });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${first.id}/start`);

    await assert.rejects(h.dataSource.query("UPDATE sprints SET status = 'active' WHERE id = ?", [second.id]), /UNIQUE constraint failed/);
  });

  it("no se inician sprints en proyectos finalizados", async () => {
    const { coordinator, projectId } = await team();
    const sprint = await newSprint(coordinator, projectId);
    await ok(coordinator, "POST", `/projects/${projectId}/status`, { status: "cancelled" });

    const start = await send(coordinator, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);

    assert.equal(start.json.code, "PROJECT_NOT_EDITABLE");
  });
});

describe("tablero del sprint activo (prueba F2-3)", () => {
  it("el colaborador mueve sus tareas del sprint por los estados", async () => {
    const { leader, collaborator, projectId } = await team();
    const task = await newTask(leader, projectId, { assigneeId: collaborator.id });
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [task.id] });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);

    for (const status of ["in_progress", "in_review", "done"]) {
      const moved = await ok(collaborator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status });
      assert.equal(moved.sprintId, sprint.id);
    }

    const detail = await h.request(`/projects/${projectId}/sprints/${sprint.id}`, { cookies: collaborator.cookies });
    assert.deepEqual(detail.json.progress, { total: 1, done: 1, byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 1 } });
  });
});

describe("cierre y cancelacion (F2-17, F2-18, prueba F2-6)", () => {
  it("el cierre registra el estado final; las terminadas conservan el sprint y las demas vuelven al backlog", async () => {
    const { leader, projectId } = await team();
    const done = await newTask(leader, projectId, { title: "Terminada", status: "done" });
    const review = await newTask(leader, projectId, { title: "En revision", status: "in_review" });
    const todo = await newTask(leader, projectId, { title: "Pendiente" });
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [done.id, review.id, todo.id] });

    const early = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/complete`);
    assert.equal(early.json.code, "INVALID_SPRINT_TRANSITION");

    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    const closed = await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/complete`);

    assert.equal(closed.status, "completed");
    assert.ok(closed.finishedAt);
    assert.deepEqual(
      closed.closure.map((item: { title: string; statusAtClose: string }) => [item.title, item.statusAtClose]),
      [
        ["Terminada", "done"],
        ["En revision", "in_review"],
        ["Pendiente", "todo"],
      ],
    );
    assert.deepEqual(closed.progress, { total: 3, done: 1, byStatus: { todo: 1, in_progress: 0, in_review: 1, done: 1 } });

    const tasks = await h.request(`/projects/${projectId}/tasks`, { cookies: leader.cookies });
    const byTitle = Object.fromEntries(tasks.json.items.map((task: { title: string }) => [task.title, task]));
    assert.equal(byTitle.Terminada.sprintId, sprint.id);
    assert.equal(byTitle["En revision"].sprintId, null);
    assert.equal(byTitle["En revision"].status, "in_review"); // no se marca como hecha
    assert.equal(byTitle.Pendiente.sprintId, null);

    const reopen = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    const addLate = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [todo.id] });
    assert.equal(reopen.json.code, "INVALID_SPRINT_TRANSITION");
    assert.equal(addLate.json.code, "SPRINT_CLOSED");
  });

  it("el registro de cierre no cambia aunque la tarea cambie despues; reabrirla la devuelve al backlog", async () => {
    const { leader, projectId } = await team();
    const task = await newTask(leader, projectId, { status: "done" });
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [task.id] });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/complete`);

    const reopened = await ok(leader, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status: "in_progress" });
    const detail = await h.request(`/projects/${projectId}/sprints/${sprint.id}`, { cookies: leader.cookies });

    assert.equal(reopened.sprintId, null);
    assert.deepEqual(detail.json.closure, [{ taskId: task.id, statusAtClose: "done", title: "Tarea ficticia", currentStatus: "in_progress" }]);
    assert.equal(detail.json.progress.done, 1);
  });

  it("cancelar exige motivo, devuelve lo pendiente al backlog y no se reactiva", async () => {
    const { leader, projectId } = await team();
    const task = await newTask(leader, projectId);
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [task.id] });

    const withoutReason = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/cancel`, {});
    const cancelled = await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/cancel`, { reason: "Cambio de prioridades" });
    const again = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/cancel`, { reason: "Otra vez" });
    const start = await send(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    const backlog = await h.request(`/projects/${projectId}/tasks?sprintId=none`, { cookies: leader.cookies });

    assert.equal(withoutReason.response.status, 400);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(cancelled.cancelReason, "Cambio de prioridades");
    assert.equal(cancelled.closure.length, 1);
    assert.equal(again.json.code, "INVALID_SPRINT_TRANSITION");
    assert.equal(start.json.code, "INVALID_SPRINT_TRANSITION");
    assert.equal(backlog.json.total, 1);
  });
});

describe("permisos y visibilidad (pruebas F2-7 y F2-8)", () => {
  it("un colaborador ve los sprints pero no los crea, planifica, inicia ni cierra", async () => {
    const { leader, collaborator, projectId } = await team();
    const task = await newTask(leader, projectId);
    const sprint = await newSprint(leader, projectId);
    const base = `/projects/${projectId}/sprints`;

    const list = await h.request(base, { cookies: collaborator.cookies });
    assert.equal(list.response.status, 200);
    assert.equal(list.json.permissions.canCreateSprints, false);
    assert.equal(list.json.items[0].permissions.canStart, false);

    for (const [method, path, body] of [
      ["POST", base, { name: "Intento", startDate: "2026-11-02", endDate: "2026-11-13" }],
      ["PATCH", `${base}/${sprint.id}`, { name: "Intento" }],
      ["POST", `${base}/${sprint.id}/tasks`, { taskIds: [task.id] }],
      ["POST", `${base}/${sprint.id}/start`, undefined],
      ["POST", `${base}/${sprint.id}/cancel`, { reason: "Intento" }],
    ] as const) {
      const { response } = await send(collaborator, method, path, body);
      assert.equal(response.status, 403, `${method} ${path}`);
    }

    const reassign = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { assigneeId: collaborator.id });
    assert.equal(reassign.response.status, 403);
  });

  it("un ajeno recibe 404 y un sprint no se consulta desde otro proyecto", async () => {
    const a = await team();
    const b = await team();
    const sprint = await newSprint(a.leader, a.projectId);
    const outsider = await person(["teacher_leader"]);

    const outsiderList = await h.request(`/projects/${a.projectId}/sprints`, { cookies: outsider.cookies });
    const outsiderStart = await send(outsider, "POST", `/projects/${a.projectId}/sprints/${sprint.id}/start`);
    const crossProject = await h.request(`/projects/${b.projectId}/sprints/${sprint.id}`, { cookies: b.coordinator.cookies });
    const unknown = await h.request(`/projects/${a.projectId}/sprints/${randomUUID()}`, { cookies: a.leader.cookies });

    assert.equal(outsiderList.response.status, 404);
    assert.equal(outsiderStart.response.status, 404);
    assert.equal(crossProject.json.code, "SPRINT_NOT_FOUND");
    assert.equal(unknown.response.status, 404);
  });
});

describe("cambio de modalidad (F2-19)", () => {
  it("tradicional -> agil deja las tareas en el backlog; agil -> tradicional solo sin sprints", async () => {
    const { leader, collaborator, projectId } = await team("traditional");
    await newTask(leader, projectId);

    const byCollaborator = await send(collaborator, "POST", `/projects/${projectId}/methodology`, { methodology: "agile" });
    const toAgile = await ok(leader, "POST", `/projects/${projectId}/methodology`, { methodology: "agile" });
    const backlog = await h.request(`/projects/${projectId}/tasks?sprintId=none`, { cookies: leader.cookies });
    const backToTraditional = await ok(leader, "POST", `/projects/${projectId}/methodology`, { methodology: "traditional" });
    await ok(leader, "POST", `/projects/${projectId}/methodology`, { methodology: "agile" });
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/cancel`, { reason: "Ya no se usara" });
    const blocked = await send(leader, "POST", `/projects/${projectId}/methodology`, { methodology: "traditional" });

    assert.equal(byCollaborator.response.status, 403);
    assert.equal(toAgile.methodology, "agile");
    assert.equal(backlog.json.total, 1);
    assert.equal(backToTraditional.methodology, "traditional");
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.json.code, "PROJECT_HAS_SPRINTS");
  });
});

describe("auditoria (F2-21)", () => {
  it("registra creacion, planificacion, inicio y cierre del sprint con su autor", async () => {
    const { leader, projectId } = await team();
    const task = await newTask(leader, projectId);
    const sprint = await newSprint(leader, projectId);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/tasks`, { taskIds: [task.id] });
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/start`);
    await ok(leader, "POST", `/projects/${projectId}/sprints/${sprint.id}/complete`);

    const repository = h.dataSource.getRepository(AuditEvent);
    const sprintEvents = await repository.find({ where: { targetId: sprint.id }, order: { createdAt: "ASC" } });
    const taskEvents = await repository.findBy({ targetId: task.id, action: "task.sprint_changed" });

    assert.deepEqual(sprintEvents.map((event) => event.action).sort(), ["sprint.completed", "sprint.created", "sprint.started"]);
    assert.ok(sprintEvents.every((event) => event.actorUserId === leader.id));
    assert.deepEqual(JSON.parse(sprintEvents.find((event) => event.action === "sprint.completed")!.details!), {
      projectId,
      from: "active",
      done: 0,
      returnedToBacklog: 1,
    });
    assert.equal(taskEvents.length, 1);
  });
});
