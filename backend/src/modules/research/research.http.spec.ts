import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { type HttpHarness, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import type { RoleCode } from "../roles/role.entity";
import { Task } from "../tasks/task.entity";
import { User } from "../users/user.entity";

let h: HttpHarness;
let counter = 0;

type Session = { cookies: string[]; csrf: string; id: string };

async function person(roles: RoleCode[]): Promise<Session> {
  counter += 1;
  const email = `investigacion-${counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles });
  return { ...(await h.loginOk(email)), id: user.id };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

async function createLine(session: Session, body: Record<string, unknown> = {}) {
  counter += 1;
  const result = await send(session, "POST", "/research-lines", { name: `Linea ficticia ${counter}`, ...body });
  assert.equal(result.response.status, 201, result.text);
  return result.json as { id: string; name: string; status: string; projectCount: number };
}

/** Proyecto del coordinador (lider) con un lider y un colaborador ademas. */
async function team(type = "research") {
  const coordinator = await person(["coordinator"]);
  const leader = await person(["teacher_leader"]);
  const collaborator = await person(["student"]);
  const created = await send(coordinator, "POST", "/projects", { name: "Proyecto investigativo", type, methodology: "traditional" });
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

before(async () => {
  h = await startHttpHarness();
});

after(async () => {
  await h?.close();
});

describe("lineas de investigacion (F3-01)", () => {
  it("la coordinacion crea, edita y desactiva lineas; queda auditado", async () => {
    const coordinator = await person(["coordinator"]);
    const responsible = await person(["teacher_leader"]);

    const line = await createLine(coordinator, {
      description: "Descripcion",
      objectives: "Objetivos",
      responsibleUserId: responsible.id,
    });
    assert.equal(line.status, "active");
    assert.equal(line.projectCount, 0);

    const updated = await send(coordinator, "PATCH", `/research-lines/${line.id}`, { status: "inactive", description: null });
    assert.equal(updated.response.status, 200, updated.text);
    assert.equal(updated.json.status, "inactive");
    assert.equal(updated.json.description, null);
    assert.equal(updated.json.responsible.userId, responsible.id);

    const events = await h.dataSource.getRepository(AuditEvent).findBy({ targetId: line.id });
    assert.deepEqual(events.map((event) => event.action).sort(), ["research_line.created", "research_line.status_changed"]);
    assert.ok(events.every((event) => event.actorUserId === coordinator.id));
  });

  it("solo admin y coordinator gestionan lineas, aunque se llame a la API", async () => {
    const coordinator = await person(["coordinator"]);
    const line = await createLine(coordinator);

    for (const roles of [["teacher_leader"], ["researcher"], ["student"]] as RoleCode[][]) {
      const other = await person(roles);
      const created = await send(other, "POST", "/research-lines", { name: "Intento sin permiso" });
      assert.equal(created.response.status, 403, roles.join());
      assert.equal((await send(other, "PATCH", `/research-lines/${line.id}`, { name: "Cambio" })).response.status, 403);
      assert.equal((await send(other, "DELETE", `/research-lines/${line.id}`)).response.status, 403);
    }

    const admin = await person(["admin"]);
    await createLine(admin);
  });

  it("cualquier integrante consulta las lineas y filtra por nombre y estado", async () => {
    const coordinator = await person(["coordinator"]);
    const student = await person(["student"]);
    const marker = randomUUID().slice(0, 8);
    const active = await createLine(coordinator, { name: `Robótica ${marker}` });
    const inactive = await createLine(coordinator, { name: `Robotica educativa ${marker}` });
    await send(coordinator, "PATCH", `/research-lines/${inactive.id}`, { status: "inactive" });

    const list = await send(student, "GET", `/research-lines?q=${encodeURIComponent(`robotica ${marker}`)}`);
    assert.equal(list.response.status, 200, list.text);
    assert.deepEqual(list.json.items.map((item: { id: string }) => item.id), [active.id]);
    assert.equal(list.json.permissions.canManageLines, false);
    assert.equal(list.json.items[0].permissions.canEdit, false);

    const onlyInactive = await send(student, "GET", `/research-lines?status=inactive&q=${marker}`);
    assert.deepEqual(onlyInactive.json.items.map((item: { id: string }) => item.id), [inactive.id]);

    const detail = await send(student, "GET", `/research-lines/${active.id}`);
    assert.equal(detail.response.status, 200);
    assert.deepEqual(detail.json.projects, []);
  });

  it("valida el nombre, impide duplicados aunque cambien tildes o mayusculas y exige responsable activo", async () => {
    const coordinator = await person(["coordinator"]);
    const marker = randomUUID().slice(0, 8);
    await createLine(coordinator, { name: `Ingeniería de Software ${marker}` });

    const duplicate = await send(coordinator, "POST", "/research-lines", { name: `  INGENIERIA   de software ${marker}` });
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.json.code, "RESEARCH_LINE_NAME_TAKEN");

    for (const body of [{ name: "ab" }, { name: "Linea", status: "active" }, { name: "Linea", responsibleUserId: "x" }]) {
      const { response, json } = await send(coordinator, "POST", "/research-lines", body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.equal(json.code, "VALIDATION_ERROR");
    }

    const inactiveUser = await person(["student"]);
    await h.dataSource.getRepository(User).update({ id: inactiveUser.id }, { accountStatus: "inactive" });

    for (const responsibleUserId of [inactiveUser.id, randomUUID()]) {
      const { response, json } = await send(coordinator, "POST", "/research-lines", { name: `Linea ${randomUUID()}`, responsibleUserId });
      assert.equal(response.status, 409);
      assert.equal(json.code, "RESPONSIBLE_NOT_ACTIVE");
    }

    assert.equal((await send(coordinator, "GET", `/research-lines/${randomUUID()}`)).response.status, 404);
    assert.equal((await send(coordinator, "GET", "/research-lines/no-es-un-id")).response.status, 400);
  });

  it("una linea sin proyectos se elimina; con proyectos solo se desactiva", async () => {
    const { coordinator, projectId } = await team();
    const unused = await createLine(coordinator);
    const used = await createLine(coordinator);
    await send(coordinator, "POST", `/projects/${projectId}/research-lines`, { researchLineId: used.id });

    assert.equal((await send(coordinator, "DELETE", `/research-lines/${unused.id}`)).response.status, 204);
    assert.equal((await send(coordinator, "GET", `/research-lines/${unused.id}`)).response.status, 404);

    const blocked = await send(coordinator, "DELETE", `/research-lines/${used.id}`);
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.json.code, "RESEARCH_LINE_IN_USE");
  });
});

describe("lineas de un proyecto (F3-02)", () => {
  it("el lider asocia varias lineas, sin duplicados, y puede quitarlas", async () => {
    const { coordinator, leader, projectId } = await team();
    const marker = randomUUID().slice(0, 8);
    // Se asocian en orden inverso al alfabetico: la lista sale ordenada por nombre.
    const second = await createLine(coordinator, { name: `Zeta ${marker}` });
    const first = await createLine(coordinator, { name: `Alfa ${marker}` });

    for (const line of [second, first]) {
      const linked = await send(leader, "POST", `/projects/${projectId}/research-lines`, { researchLineId: line.id });
      assert.equal(linked.response.status, 201, linked.text);
    }

    const duplicate = await send(leader, "POST", `/projects/${projectId}/research-lines`, { researchLineId: first.id });
    assert.equal(duplicate.response.status, 409);
    assert.equal(duplicate.json.code, "RESEARCH_LINE_ALREADY_LINKED");

    const list = await send(leader, "GET", `/projects/${projectId}/research-lines`);
    assert.deepEqual(list.json.items.map((item: { id: string }) => item.id), [first.id, second.id]);
    assert.equal(list.json.permissions.canManageLines, true);

    const removed = await send(leader, "DELETE", `/projects/${projectId}/research-lines/${first.id}`);
    assert.equal(removed.response.status, 200, removed.text);
    assert.deepEqual(removed.json.items.map((item: { id: string }) => item.id), [second.id]);
    assert.equal((await send(leader, "DELETE", `/projects/${projectId}/research-lines/${first.id}`)).response.status, 404);

    const detail = await send(leader, "GET", `/research-lines/${second.id}`);
    assert.equal(detail.json.projectCount, 1);
    assert.deepEqual(detail.json.projects.map((project: { id: string }) => project.id), [projectId]);
  });

  it("rechaza lineas inexistentes o inactivas y proyectos inexistentes", async () => {
    const { coordinator, leader, projectId } = await team();
    const inactive = await createLine(coordinator);
    await send(coordinator, "PATCH", `/research-lines/${inactive.id}`, { status: "inactive" });

    const missing = await send(leader, "POST", `/projects/${projectId}/research-lines`, { researchLineId: randomUUID() });
    assert.equal(missing.response.status, 404);
    assert.equal(missing.json.code, "RESEARCH_LINE_NOT_FOUND");

    const blocked = await send(leader, "POST", `/projects/${projectId}/research-lines`, { researchLineId: inactive.id });
    assert.equal(blocked.response.status, 409);
    assert.equal(blocked.json.code, "RESEARCH_LINE_INACTIVE");

    const line = await createLine(coordinator);
    const noProject = await send(coordinator, "POST", `/projects/${randomUUID()}/research-lines`, { researchLineId: line.id });
    assert.equal(noProject.response.status, 404);
    assert.equal(noProject.json.code, "PROJECT_NOT_FOUND");
  });

  it("el colaborador consulta pero no asocia; un ajeno recibe 404 y solo ve sus proyectos en la linea", async () => {
    const { coordinator, collaborator, projectId } = await team();
    const outsider = await person(["teacher_leader"]);
    const line = await createLine(coordinator);
    await send(coordinator, "POST", `/projects/${projectId}/research-lines`, { researchLineId: line.id });

    const view = await send(collaborator, "GET", `/projects/${projectId}/research-lines`);
    assert.equal(view.response.status, 200);
    assert.equal(view.json.permissions.canManageLines, false);
    const other = await createLine(coordinator);
    assert.equal((await send(collaborator, "POST", `/projects/${projectId}/research-lines`, { researchLineId: other.id })).response.status, 403);
    assert.equal((await send(collaborator, "DELETE", `/projects/${projectId}/research-lines/${line.id}`)).response.status, 403);

    assert.equal((await send(outsider, "GET", `/projects/${projectId}/research-lines`)).response.status, 404);
    const lineDetail = await send(outsider, "GET", `/research-lines/${line.id}`);
    assert.equal(lineDetail.json.projectCount, 1);
    assert.deepEqual(lineDetail.json.projects, []);
  });
});

describe("ficha investigativa (F3-03)", () => {
  it("un proyecto no investigativo funciona sin ficha", async () => {
    const { leader, projectId } = await team("software");

    const profile = await send(leader, "GET", `/projects/${projectId}/research-profile`);
    assert.equal(profile.response.status, 200, profile.text);
    assert.equal(profile.json.profile, null);
    assert.equal(profile.json.permissions.canEdit, true);

    const task = await send(leader, "POST", `/projects/${projectId}/tasks`, { title: "Tarea sin ficha" });
    assert.equal(task.response.status, 201);
  });

  it("el lider crea y edita la misma ficha sin duplicarla; el colaborador solo la consulta", async () => {
    const { leader, collaborator, projectId } = await team();

    const created = await send(leader, "PUT", `/projects/${projectId}/research-profile`, {
      problem: "Problema",
      question: "Pregunta",
      methodology: "Metodologia",
    });
    assert.equal(created.response.status, 200, created.text);
    assert.equal(created.json.profile.problem, "Problema");
    assert.equal(created.json.profile.justification, null);
    assert.equal(created.json.profile.updatedBy.userId, leader.id);

    const updated = await send(leader, "PUT", `/projects/${projectId}/research-profile`, { problem: "Problema revisado", notes: "Notas" });
    assert.equal(updated.json.profile.problem, "Problema revisado");
    assert.equal(updated.json.profile.question, null);
    assert.equal(updated.json.profile.notes, "Notas");

    const rows = await h.dataSource.query("SELECT COUNT(*) AS count FROM project_research_profiles WHERE project_id = ?", [projectId]);
    assert.equal(Number(rows[0].count), 1);

    const read = await send(collaborator, "GET", `/projects/${projectId}/research-profile`);
    assert.equal(read.json.profile.problem, "Problema revisado");
    assert.equal(read.json.permissions.canEdit, false);
    assert.equal((await send(collaborator, "PUT", `/projects/${projectId}/research-profile`, { problem: "x" })).response.status, 403);

    const events = await h.dataSource.getRepository(AuditEvent).findBy({ targetId: projectId });
    assert.deepEqual(
      events.map((event) => event.action).filter((action) => action.startsWith("project.research_profile")),
      ["project.research_profile_created", "project.research_profile_updated"],
    );
  });

  it("valida longitudes y un ajeno no la consulta", async () => {
    const { leader, projectId } = await team();
    const outsider = await person(["student"]);

    const tooLong = await send(leader, "PUT", `/projects/${projectId}/research-profile`, { question: "x".repeat(2001) });
    assert.equal(tooLong.response.status, 400);
    assert.equal((await send(leader, "PUT", `/projects/${projectId}/research-profile`, { extra: "x" })).response.status, 400);
    assert.equal((await send(outsider, "GET", `/projects/${projectId}/research-profile`)).response.status, 404);
  });
});

describe("resultados (F3-04)", () => {
  it("el lider registra un resultado con participantes del proyecto sin crear tareas", async () => {
    const { leader, collaborator, projectId } = await team();
    const tasksBefore = await h.dataSource.getRepository(Task).countBy({ projectId });

    const created = await send(leader, "POST", `/projects/${projectId}/research-results`, {
      title: "Hallazgo preliminar",
      description: "Detalle",
      type: "finding",
      resultDate: "2026-10-01",
      references: "Informe de avance",
      participantIds: [collaborator.id, leader.id],
    });
    assert.equal(created.response.status, 201, created.text);
    assert.equal(created.json.type, "finding");
    assert.deepEqual(
      created.json.participants.map((participant: { userId: string }) => participant.userId).sort(),
      [collaborator.id, leader.id].sort(),
    );
    assert.equal(await h.dataSource.getRepository(Task).countBy({ projectId }), tasksBefore);

    const list = await send(collaborator, "GET", `/projects/${projectId}/research-results`);
    assert.equal(list.response.status, 200);
    assert.equal(list.json.items.length, 1);
    assert.equal(list.json.permissions.canManageResults, false);
    assert.equal(list.json.items[0].permissions.canEdit, false);
  });

  it("los participantes deben ser integrantes; quien salio del equipo se conserva en resultados previos", async () => {
    const { coordinator, leader, collaborator, projectId } = await team();
    const outsider = await person(["student"]);

    for (const participantIds of [[outsider.id], [randomUUID()]]) {
      const { response, json } = await send(leader, "POST", `/projects/${projectId}/research-results`, { title: "Resultado", participantIds });
      assert.equal(response.status, 409);
      assert.equal(json.code, "PARTICIPANT_NOT_PROJECT_MEMBER");
    }

    const created = await send(leader, "POST", `/projects/${projectId}/research-results`, {
      title: "Prototipo",
      type: "prototype",
      participantIds: [collaborator.id],
    });
    const removed = await send(coordinator, "DELETE", `/projects/${projectId}/members/${collaborator.id}`);
    assert.equal(removed.response.status, 200, removed.text);

    const kept = await send(leader, "PATCH", `/projects/${projectId}/research-results/${created.json.id}`, {
      title: "Prototipo funcional",
      participantIds: [collaborator.id, leader.id],
    });
    assert.equal(kept.response.status, 200, kept.text);
    assert.equal(kept.json.participants.length, 2);

    const other = await send(leader, "POST", `/projects/${projectId}/research-results`, { title: "Otro", participantIds: [collaborator.id] });
    assert.equal(other.response.status, 409);
  });

  it("edita, valida y elimina; el colaborador no gestiona y queda auditado", async () => {
    const { leader, collaborator, projectId } = await team();
    const created = await send(leader, "POST", `/projects/${projectId}/research-results`, { title: "Aporte" });
    const resultId = created.json.id as string;

    for (const body of [{ title: "ab" }, { type: "article" }, { resultDate: "2026-02-30" }, { projectId: randomUUID() }]) {
      const { response } = await send(leader, "PATCH", `/projects/${projectId}/research-results/${resultId}`, body);
      assert.equal(response.status, 400, JSON.stringify(body));
    }

    const updated = await send(leader, "PATCH", `/projects/${projectId}/research-results/${resultId}`, {
      type: "methodological",
      resultDate: "2026-09-30",
    });
    assert.equal(updated.json.type, "methodological");
    assert.equal(updated.json.resultDate, "2026-09-30");

    assert.equal((await send(collaborator, "POST", `/projects/${projectId}/research-results`, { title: "Intento" })).response.status, 403);
    assert.equal((await send(collaborator, "PATCH", `/projects/${projectId}/research-results/${resultId}`, { title: "Cambio" })).response.status, 403);
    assert.equal((await send(collaborator, "DELETE", `/projects/${projectId}/research-results/${resultId}`)).response.status, 403);

    assert.equal((await send(leader, "DELETE", `/projects/${projectId}/research-results/${resultId}`)).response.status, 204);
    assert.equal((await send(leader, "GET", `/projects/${projectId}/research-results/${resultId}`)).response.status, 404);

    const events = await h.dataSource.getRepository(AuditEvent).findBy({ targetId: resultId });
    assert.deepEqual(events.map((event) => event.action).sort(), [
      "research_result.created",
      "research_result.deleted",
      "research_result.updated",
    ]);
  });

  it("un resultado no se consulta desde otro proyecto y un ajeno recibe 404", async () => {
    const first = await team();
    const second = await team();
    const outsider = await person(["teacher_leader"]);
    const created = await send(first.leader, "POST", `/projects/${first.projectId}/research-results`, { title: "Resultado" });

    // El lider del segundo proyecto conoce el ID pero lo pide bajo su propio proyecto.
    const crossed = await send(second.leader, "GET", `/projects/${second.projectId}/research-results/${created.json.id}`);
    assert.equal(crossed.response.status, 404);
    assert.equal(crossed.json.code, "RESEARCH_RESULT_NOT_FOUND");
    assert.equal(
      (await send(second.leader, "PATCH", `/projects/${second.projectId}/research-results/${created.json.id}`, { title: "Cambio" })).response.status,
      404,
    );

    assert.equal((await send(outsider, "GET", `/projects/${first.projectId}/research-results`)).response.status, 404);
    assert.equal((await send(outsider, "GET", `/projects/${first.projectId}/research-results/${created.json.id}`)).response.status, 404);
  });

  it("un proyecto finalizado queda en solo lectura", async () => {
    const { coordinator, leader, projectId } = await team();
    const line = await createLine(coordinator);
    await send(leader, "POST", `/projects/${projectId}/research-lines`, { researchLineId: line.id });
    const created = await send(leader, "POST", `/projects/${projectId}/research-results`, { title: "Resultado previo" });
    const cancelled = await send(coordinator, "POST", `/projects/${projectId}/status`, { status: "cancelled", reason: "Prueba" });
    assert.ok(cancelled.response.status < 300, cancelled.text);

    for (const [method, path, body] of [
      ["POST", `/projects/${projectId}/research-results`, { title: "Nuevo" }],
      ["PATCH", `/projects/${projectId}/research-results/${created.json.id}`, { title: "Cambio" }],
      ["PUT", `/projects/${projectId}/research-profile`, { problem: "Problema" }],
      ["DELETE", `/projects/${projectId}/research-lines/${line.id}`, undefined],
    ] as const) {
      const { response, json } = await send(leader, method, path, body);
      assert.equal(response.status, 409, `${method} ${path}`);
      assert.equal(json.code, "PROJECT_NOT_EDITABLE");
    }

    const results = await send(leader, "GET", `/projects/${projectId}/research-results`);
    assert.equal(results.json.items.length, 1);
    assert.equal(results.json.permissions.canManageResults, false);
  });
});
