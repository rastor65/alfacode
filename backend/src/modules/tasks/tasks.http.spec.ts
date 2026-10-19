import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { type HttpHarness, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import type { RoleCode } from "../roles/role.entity";
import { User } from "../users/user.entity";

let h: HttpHarness;
let counter = 0;

type Session = { cookies: string[]; csrf: string; id: string };
type TaskBody = {
  id: string;
  status: string;
  priority: string;
  sprintId: string | null;
  assignee: { userId: string } | null;
  permissions: { canEdit: boolean; canChangeStatus: boolean };
};

async function person(roles: RoleCode[]): Promise<Session> {
  counter += 1;
  const email = `tarea-${counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles });
  return { ...(await h.loginOk(email)), id: user.id };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

/** Proyecto del coordinador (lider) con una lider y un colaborador ademas. */
async function team(methodology: "agile" | "traditional" = "agile") {
  const coordinator = await person(["coordinator"]);
  const leader = await person(["teacher_leader"]);
  const collaborator = await person(["student"]);
  const created = await send(coordinator, "POST", "/projects", { name: "Proyecto con tareas", type: "software", methodology });
  assert.equal(created.response.status, 201, created.text);
  const projectId = created.json.id as string;

  for (const [member, role] of [
    [leader, "leader"],
    [collaborator, "collaborator"],
  ] as const) {
    const added = await send(coordinator, "POST", `/projects/${projectId}/members`, { userId: member.id, role });
    assert.equal(added.response.status, 201, added.text);
  }

  return { coordinator, leader, collaborator, projectId };
}

async function createTask(session: Session, projectId: string, body: Record<string, unknown> = {}) {
  const result = await send(session, "POST", `/projects/${projectId}/tasks`, { title: "Tarea ficticia", ...body });
  assert.equal(result.response.status, 201, result.text);
  return result.json as TaskBody;
}

before(async () => {
  h = await startHttpHarness();
});

after(async () => {
  await h?.close();
});

describe("crear tareas (F2-07, F2-08, F2-09)", () => {
  it("el lider crea una tarea en el backlog con valores por defecto", async () => {
    const { leader, projectId } = await team();

    const task = await createTask(leader, projectId, { description: "Detalle", dueDate: "2026-12-15" });

    assert.equal(task.status, "todo");
    assert.equal(task.priority, "medium");
    assert.equal(task.sprintId, null);
    assert.equal(task.assignee, null);
    assert.deepEqual(task.permissions, { canEdit: true, canChangeStatus: true });
  });

  it("un colaborador no crea tareas aunque llame a la API", async () => {
    const { collaborator, projectId } = await team();

    const { response } = await send(collaborator, "POST", `/projects/${projectId}/tasks`, { title: "Intento" });

    assert.equal(response.status, 403);
  });

  it("la persona asignada debe ser integrante activo del proyecto", async () => {
    const { leader, projectId } = await team();
    const outsider = await person(["student"]);
    const inactive = await person(["student"]);
    const coordinator2 = await person(["coordinator"]);
    await send(coordinator2, "POST", `/projects/${projectId}/members`, { userId: inactive.id, role: "collaborator" });
    await h.dataSource.getRepository(User).update({ id: inactive.id }, { accountStatus: "inactive" });

    for (const assigneeId of [outsider.id, inactive.id, randomUUID()]) {
      const { response, json } = await send(leader, "POST", `/projects/${projectId}/tasks`, { title: "Asignada", assigneeId });
      assert.equal(response.status, 409, assigneeId);
      assert.equal(json.code, "ASSIGNEE_NOT_PROJECT_MEMBER");
    }
  });

  it("valida datos y no acepta proyecto ni sprint desde el cliente", async () => {
    const { leader, projectId } = await team();
    const other = await team();

    for (const body of [
      { title: "ab" },
      { title: "Tarea", status: "blocked" },
      { title: "Tarea", priority: "urgent" },
      { title: "Tarea", dueDate: "2026-02-30" },
      { title: "Tarea", projectId: other.projectId },
      { title: "Tarea", sprintId: randomUUID() },
    ]) {
      const { response, json } = await send(leader, "POST", `/projects/${projectId}/tasks`, body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.equal(json.code, "VALIDATION_ERROR");
    }
  });
});

describe("estado y edicion (F2-09, F2-11)", () => {
  it("el colaborador mueve sus tareas por los estados y el cambio persiste", async () => {
    const { leader, collaborator, projectId } = await team();
    const task = await createTask(leader, projectId, { assigneeId: collaborator.id });

    for (const status of ["in_progress", "in_review", "done", "in_progress"]) {
      const moved = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status });
      assert.equal(moved.response.status, 200, moved.text);
      assert.equal(moved.json.status, status);
      assert.deepEqual(moved.json.permissions, { canEdit: false, canChangeStatus: true });
    }

    const reloaded = await h.request(`/projects/${projectId}/tasks/${task.id}`, { cookies: collaborator.cookies });
    assert.equal(reloaded.json.status, "in_progress");
  });

  it("un colaborador no cambia tareas ajenas ni otros campos de las suyas", async () => {
    const { leader, collaborator, projectId } = await team();
    const unassigned = await createTask(leader, projectId);
    const mine = await createTask(leader, projectId, { assigneeId: collaborator.id });

    const others = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${unassigned.id}`, { status: "done" });
    const takeOver = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${unassigned.id}`, {
      assigneeId: collaborator.id,
    });
    const reprioritize = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${mine.id}`, {
      status: "done",
      priority: "high",
    });
    const reassign = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${mine.id}`, { assigneeId: leader.id });

    assert.equal(others.response.status, 403);
    assert.equal(takeOver.response.status, 403);
    assert.equal(reprioritize.response.status, 403);
    assert.equal(reassign.response.status, 403);
  });

  it("el lider edita, reasigna, prioriza y quita la fecha limite", async () => {
    const { leader, collaborator, projectId } = await team();
    const task = await createTask(leader, projectId, { dueDate: "2026-12-01" });

    const updated = await send(leader, "PATCH", `/projects/${projectId}/tasks/${task.id}`, {
      title: "Tarea renombrada",
      priority: "high",
      assigneeId: collaborator.id,
      dueDate: null,
      description: null,
    });

    assert.equal(updated.response.status, 200, updated.text);
    assert.equal(updated.json.title, "Tarea renombrada");
    assert.equal(updated.json.priority, "high");
    assert.equal(updated.json.assignee.userId, collaborator.id);
    assert.equal(updated.json.dueDate, null);
  });

  it("los proyectos finalizados quedan en solo lectura", async () => {
    const { coordinator, collaborator, projectId } = await team();
    const task = await createTask(coordinator, projectId, { assigneeId: collaborator.id });
    await send(coordinator, "POST", `/projects/${projectId}/status`, { status: "cancelled" });

    const create = await send(coordinator, "POST", `/projects/${projectId}/tasks`, { title: "Tarde" });
    const move = await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status: "done" });
    const list = await h.request(`/projects/${projectId}/tasks`, { cookies: collaborator.cookies });

    assert.equal(create.response.status, 409);
    assert.equal(move.response.status, 409);
    assert.equal(list.json.permissions.canManageTasks, false);
    assert.deepEqual(list.json.items[0].permissions, { canEdit: false, canChangeStatus: false });
  });
});

describe("contrato de proyecto y visibilidad (F2-08, prueba F2-7)", () => {
  it("una tarea no se consulta ni modifica desde la URL de otro proyecto", async () => {
    const a = await team();
    const b = await team();
    const task = await createTask(a.coordinator, a.projectId);

    // Quien coordina B es autoridad: ve ambos proyectos, pero la tarea solo existe en A.
    const read = await h.request(`/projects/${b.projectId}/tasks/${task.id}`, { cookies: b.coordinator.cookies });
    const write = await send(b.coordinator, "PATCH", `/projects/${b.projectId}/tasks/${task.id}`, { status: "done" });

    assert.equal(read.response.status, 404);
    assert.equal(read.json.code, "TASK_NOT_FOUND");
    assert.equal(write.response.status, 404);
  });

  it("un ajeno al proyecto recibe 404 en tareas aunque conozca los ID", async () => {
    const { leader, projectId } = await team();
    const task = await createTask(leader, projectId);
    const outsider = await person(["teacher_leader"]);

    for (const result of [
      await h.request(`/projects/${projectId}/tasks`, { cookies: outsider.cookies }),
      await h.request(`/projects/${projectId}/tasks/${task.id}`, { cookies: outsider.cookies }),
      await send(outsider, "POST", `/projects/${projectId}/tasks`, { title: "Intrusa" }),
      await send(outsider, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status: "done" }),
    ]) {
      assert.equal(result.response.status, 404, result.text);
    }
  });

  it("los integrantes ven el backlog con filtros y orden por prioridad", async () => {
    const { leader, collaborator, projectId } = await team("traditional");
    await createTask(leader, projectId, { title: "Baja", priority: "low" });
    await createTask(leader, projectId, { title: "Alta", priority: "high", assigneeId: collaborator.id });
    await createTask(leader, projectId, { title: "Media hecha", status: "done" });

    const all = await h.request(`/projects/${projectId}/tasks`, { cookies: collaborator.cookies });
    const mine = await h.request(`/projects/${projectId}/tasks?assigneeId=${collaborator.id}`, { cookies: collaborator.cookies });
    const unassigned = await h.request(`/projects/${projectId}/tasks?assigneeId=none`, { cookies: collaborator.cookies });
    const done = await h.request(`/projects/${projectId}/tasks?status=done`, { cookies: collaborator.cookies });
    const search = await h.request(`/projects/${projectId}/tasks?q=ALTA`, { cookies: collaborator.cookies });
    const invalid = await h.request(`/projects/${projectId}/tasks?status=blocked`, { cookies: collaborator.cookies });

    assert.deepEqual(all.json.items.map((task: { title: string }) => task.title), ["Alta", "Media hecha", "Baja"]);
    assert.equal(all.json.permissions.canManageTasks, false);
    assert.ok(all.json.items.every((task: TaskBody) => task.sprintId === null));
    assert.deepEqual(mine.json.items.map((task: { title: string }) => task.title), ["Alta"]);
    assert.equal(unassigned.json.total, 2);
    assert.deepEqual(done.json.items.map((task: { title: string }) => task.title), ["Media hecha"]);
    assert.equal(search.json.total, 1);
    assert.equal(invalid.response.status, 400);
  });
});

describe("progreso (F2-12)", () => {
  it("sin tareas el progreso es 0 de 0, y luego refleja los conteos por estado", async () => {
    const { leader, projectId } = await team();

    const empty = await h.request(`/projects/${projectId}`, { cookies: leader.cookies });
    assert.deepEqual(empty.json.progress, { total: 0, done: 0, byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 } });

    await createTask(leader, projectId, { status: "done" });
    await createTask(leader, projectId, { status: "in_review" });
    await createTask(leader, projectId);

    const detail = await h.request(`/projects/${projectId}`, { cookies: leader.cookies });
    const list = await h.request("/projects?pageSize=100", { cookies: leader.cookies });
    const tasks = await h.request(`/projects/${projectId}/tasks`, { cookies: leader.cookies });
    const expected = { total: 3, done: 1, byStatus: { todo: 1, in_progress: 0, in_review: 1, done: 1 } };

    assert.deepEqual(detail.json.progress, expected);
    assert.deepEqual(list.json.items.find((item: { id: string }) => item.id === projectId).progress, expected);
    assert.deepEqual(tasks.json.progress, expected);
  });
});

describe("retirar miembros con tareas (F2-04)", () => {
  it("se exige desasignar las tareas abiertas; las terminadas conservan a su responsable", async () => {
    const { leader, collaborator, projectId } = await team();
    const open = await createTask(leader, projectId, { assigneeId: collaborator.id });
    const finished = await createTask(leader, projectId, { assigneeId: collaborator.id, status: "done" });

    const blocked = await send(leader, "DELETE", `/projects/${projectId}/members/${collaborator.id}`);
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.json.code, "MEMBER_HAS_ASSIGNED_TASKS");
    assert.deepEqual(blocked.json.details, { openTasks: 1 });

    const removed = await send(leader, "DELETE", `/projects/${projectId}/members/${collaborator.id}?unassignTasks=true`);
    assert.equal(removed.response.status, 200, removed.text);

    const openAfter = await h.request(`/projects/${projectId}/tasks/${open.id}`, { cookies: leader.cookies });
    const finishedAfter = await h.request(`/projects/${projectId}/tasks/${finished.id}`, { cookies: leader.cookies });
    assert.equal(openAfter.json.assignee, null);
    assert.equal(finishedAfter.json.assignee.userId, collaborator.id);
  });

  it("sin tareas abiertas se retira directamente", async () => {
    const { leader, collaborator, projectId } = await team();

    const removed = await send(leader, "DELETE", `/projects/${projectId}/members/${collaborator.id}`);

    assert.equal(removed.response.status, 200, removed.text);
  });
});

describe("auditoria (F2-21)", () => {
  it("registra alta, movimientos de estado, asignaciones y ediciones con autor", async () => {
    const { leader, collaborator, projectId } = await team();
    const task = await createTask(leader, projectId);
    await send(leader, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { assigneeId: collaborator.id, title: "Nuevo titulo" });
    await send(collaborator, "PATCH", `/projects/${projectId}/tasks/${task.id}`, { status: "in_progress" });

    const events = await h.dataSource.getRepository(AuditEvent).find({ where: { targetId: task.id }, order: { createdAt: "ASC" } });
    const summary = events.map((event) => [event.action, event.actorUserId]);

    assert.deepEqual(summary.sort(), [
      ["task.assignee_changed", leader.id],
      ["task.created", leader.id],
      ["task.status_changed", collaborator.id],
      ["task.updated", leader.id],
    ]);
    const statusEvent = events.find((event) => event.action === "task.status_changed")!;
    assert.deepEqual(JSON.parse(statusEvent.details!), { projectId, from: "todo", to: "in_progress" });
  });
});
