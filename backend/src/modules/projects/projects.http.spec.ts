import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { type HttpHarness, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import type { RoleCode } from "../roles/role.entity";

let h: HttpHarness;
let counter = 0;

type Session = { cookies: string[]; csrf: string; id: string };

async function person(roles: RoleCode[], status: "active" | "inactive" = "active"): Promise<Session> {
  counter += 1;
  const email = `proyecto-${counter}@uniguajira.edu.co`;
  const user = await h.createUser(email, { roles, status });
  if (status !== "active") {
    return { cookies: [], csrf: "", id: user.id };
  }
  return { ...(await h.loginOk(email)), id: user.id };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

async function createProject(session: Session, extra: Record<string, unknown> = {}) {
  const result = await send(session, "POST", "/projects", {
    name: "Plataforma de prueba",
    type: "software",
    methodology: "agile",
    ...extra,
  });
  assert.equal(result.response.status, 201, result.text);
  return result.json as { id: string; members: { userId: string; role: string }[]; status: string };
}

before(async () => {
  h = await startHttpHarness();
});

after(async () => {
  await h?.close();
});

describe("crear proyectos (F2-01, F2-03)", () => {
  it("el coordinador crea un proyecto en propuesta y queda como lider", async () => {
    const coordinator = await person(["coordinator"]);

    const project = await createProject(coordinator, {
      description: "Descripcion ficticia",
      startDate: "2026-11-01",
      endDate: "2027-06-30",
    });

    assert.equal(project.status, "proposed");
    assert.deepEqual(project.members.map((member) => [member.userId, member.role]), [[coordinator.id, "leader"]]);
  });

  it("un administrador tecnico puede crear sin participar", async () => {
    const admin = await person(["admin"]);

    const project = await createProject(admin, { joinAsLeader: false });

    assert.deepEqual(project.members, []);
  });

  it("solo admin y coordinator crean proyectos, aunque se llame la API directamente", async () => {
    for (const roles of [["teacher_leader"], ["researcher"], ["student"]] as RoleCode[][]) {
      const actor = await person(roles);
      const { response } = await send(actor, "POST", "/projects", { name: "Intento", type: "research", methodology: "traditional" });
      assert.equal(response.status, 403, roles.join());
    }
  });

  it("valida datos: tipo, metodologia, fechas reales y en orden, sin campos protegidos", async () => {
    const coordinator = await person(["coordinator"]);
    const base = { name: "Proyecto", type: "software", methodology: "agile" };

    for (const body of [
      { ...base, type: "secreto" },
      { ...base, methodology: "scrum" },
      { ...base, startDate: "2026-02-30" },
      { ...base, startDate: "2026-12-01", endDate: "2026-11-01" },
      { ...base, status: "active" },
      { ...base, createdBy: randomUUID() },
      { ...base, name: "ab" },
    ]) {
      const { response, json } = await send(coordinator, "POST", "/projects", body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.equal(json.code, "VALIDATION_ERROR");
    }
  });
});

describe("visibilidad (F2-05)", () => {
  it("cada quien ve solo sus proyectos; un ajeno recibe 404 aunque cambie el ID", async () => {
    const coordinator = await person(["coordinator"]);
    const member = await person(["student"]);
    const outsider = await person(["teacher_leader"]);
    const project = await createProject(coordinator, { name: "Proyecto visible solo al equipo" });
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: member.id, role: "collaborator" });

    const memberList = await h.request("/projects?pageSize=100", { cookies: member.cookies });
    const outsiderList = await h.request("/projects?pageSize=100", { cookies: outsider.cookies });
    const outsiderDetail = await h.request(`/projects/${project.id}`, { cookies: outsider.cookies });
    const outsiderMembers = await h.request(`/projects/${project.id}/members`, { cookies: outsider.cookies });
    const outsiderEdit = await send(outsider, "PATCH", `/projects/${project.id}`, { name: "Secuestrado" });

    assert.ok(memberList.json.items.some((item: { id: string }) => item.id === project.id));
    assert.equal(memberList.json.items.find((item: { id: string }) => item.id === project.id).myRole, "collaborator");
    assert.ok(!outsiderList.json.items.some((item: { id: string }) => item.id === project.id));
    assert.equal(outsiderDetail.response.status, 404);
    assert.equal(outsiderMembers.response.status, 404);
    assert.equal(outsiderEdit.response.status, 404);
  });

  it("las autoridades ven todos los proyectos y filtran por estado, metodologia y nombre", async () => {
    const coordinator = await person(["coordinator"]);
    const admin = await person(["admin"]);
    const project = await createProject(coordinator, { name: "Robot_Unico solar", methodology: "traditional" });

    const byName = await h.request(`/projects?q=${encodeURIComponent("robot_unico")}`, { cookies: admin.cookies });
    const wildcard = await h.request(`/projects?q=${encodeURIComponent("%")}`, { cookies: admin.cookies });
    const byMethodology = await h.request("/projects?methodology=agile&pageSize=100", { cookies: admin.cookies });

    assert.deepEqual(byName.json.items.map((item: { id: string }) => item.id), [project.id]);
    assert.equal(wildcard.json.total, 0);
    assert.ok(!byMethodology.json.items.some((item: { id: string }) => item.id === project.id));
  });

  it("solo las autoridades ven el correo de los miembros", async () => {
    const coordinator = await person(["coordinator"]);
    const member = await person(["student"]);
    const project = await createProject(coordinator);
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: member.id, role: "collaborator" });

    const asAuthority = await h.request(`/projects/${project.id}/members`, { cookies: coordinator.cookies });
    const asMember = await h.request(`/projects/${project.id}/members`, { cookies: member.cookies });

    assert.ok(asAuthority.json.every((item: { email?: string }) => typeof item.email === "string"));
    assert.ok(asMember.json.every((item: { email?: string }) => item.email === undefined));
  });
});

describe("equipo (F2-04)", () => {
  it("el lider gestiona el equipo; el colaborador solo consulta", async () => {
    const coordinator = await person(["coordinator"]);
    const leader = await person(["student"]);
    const collaborator = await person(["researcher"]);
    const extra = await person(["student"]);
    const project = await createProject(coordinator);
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: leader.id, role: "leader" });
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: collaborator.id, role: "collaborator" });

    const byCollaborator = await send(collaborator, "POST", `/projects/${project.id}/members`, { userId: extra.id, role: "collaborator" });
    const byLeader = await send(leader, "POST", `/projects/${project.id}/members`, { userId: extra.id, role: "collaborator" });
    const duplicate = await send(leader, "POST", `/projects/${project.id}/members`, { userId: extra.id, role: "leader" });
    const promoted = await send(leader, "PATCH", `/projects/${project.id}/members/${extra.id}`, { role: "leader" });
    const removed = await send(leader, "DELETE", `/projects/${project.id}/members/${collaborator.id}`);
    const detail = await h.request(`/projects/${project.id}`, { cookies: collaborator.cookies });

    assert.equal(byCollaborator.response.status, 403);
    assert.equal(byCollaborator.json.code, "PROJECT_FORBIDDEN");
    assert.equal(byLeader.response.status, 201, byLeader.text);
    assert.equal(duplicate.json.code, "MEMBER_ALREADY_EXISTS");
    assert.equal(promoted.json.find((item: { userId: string }) => item.userId === extra.id).role, "leader");
    assert.ok(!removed.json.some((item: { userId: string }) => item.userId === collaborator.id));
    assert.equal(detail.response.status, 404);
  });

  it("solo se agregan integrantes activos que existan", async () => {
    const coordinator = await person(["coordinator"]);
    const inactive = await person(["student"], "inactive");
    const project = await createProject(coordinator);

    const inactiveAdd = await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: inactive.id, role: "collaborator" });
    const unknownAdd = await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: randomUUID(), role: "collaborator" });

    assert.equal(inactiveAdd.json.code, "USER_NOT_ACTIVE");
    assert.equal(unknownAdd.response.status, 404);
  });

  it("un proyecto activo conserva al menos un lider", async () => {
    const coordinator = await person(["coordinator"]);
    const collaborator = await person(["student"]);
    const project = await createProject(coordinator);
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: collaborator.id, role: "collaborator" });
    await send(coordinator, "POST", `/projects/${project.id}/status`, { status: "active" });

    const demote = await send(coordinator, "PATCH", `/projects/${project.id}/members/${coordinator.id}`, { role: "collaborator" });
    const remove = await send(coordinator, "DELETE", `/projects/${project.id}/members/${coordinator.id}`);
    await send(coordinator, "PATCH", `/projects/${project.id}/members/${collaborator.id}`, { role: "leader" });
    const removeAfterPromotion = await send(coordinator, "DELETE", `/projects/${project.id}/members/${coordinator.id}`);

    assert.equal(demote.json.code, "PROJECT_LEADER_REQUIRED");
    assert.equal(remove.json.code, "PROJECT_LEADER_REQUIRED");
    assert.equal(removeAfterPromotion.response.status, 200, removeAfterPromotion.text);
  });
});

describe("estados (F2-02)", () => {
  it("activar exige un lider; un proyecto completado no se reactiva ni se edita", async () => {
    const admin = await person(["admin"]);
    const leader = await person(["student"]);
    const project = await createProject(admin, { joinAsLeader: false });

    const withoutLeader = await send(admin, "POST", `/projects/${project.id}/status`, { status: "active" });
    await send(admin, "POST", `/projects/${project.id}/members`, { userId: leader.id, role: "leader" });
    const active = await send(leader, "POST", `/projects/${project.id}/status`, { status: "active", reason: "Inicio" });
    const completed = await send(leader, "POST", `/projects/${project.id}/status`, { status: "completed" });
    const reactivate = await send(admin, "POST", `/projects/${project.id}/status`, { status: "active" });
    const edit = await send(admin, "PATCH", `/projects/${project.id}`, { name: "Nuevo nombre" });
    const addMember = await send(admin, "POST", `/projects/${project.id}/members`, { userId: admin.id, role: "leader" });
    const audit = await h.dataSource
      .getRepository(AuditEvent)
      .findBy({ action: "project.status_changed", targetId: project.id });

    assert.equal(withoutLeader.json.code, "PROJECT_LEADER_REQUIRED");
    assert.equal(active.json.status, "active");
    assert.equal(completed.json.status, "completed");
    assert.deepEqual(completed.json.permissions, {
      canEdit: false,
      canManageMembers: false,
      canManageTasks: false,
      allowedTransitions: [],
    });
    assert.equal(reactivate.json.code, "INVALID_PROJECT_STATUS_TRANSITION");
    assert.equal(edit.json.code, "PROJECT_NOT_EDITABLE");
    assert.equal(addMember.json.code, "PROJECT_NOT_EDITABLE");
    assert.equal(audit.length, 2);
  });

  it("el colaborador no cambia el estado", async () => {
    const coordinator = await person(["coordinator"]);
    const collaborator = await person(["student"]);
    const project = await createProject(coordinator);
    await send(coordinator, "POST", `/projects/${project.id}/members`, { userId: collaborator.id, role: "collaborator" });

    const { response, json } = await send(collaborator, "POST", `/projects/${project.id}/status`, { status: "cancelled" });

    assert.equal(response.status, 403);
    assert.equal(json.code, "PROJECT_FORBIDDEN");
  });
});

describe("edicion", () => {
  it("el lider edita datos generales, puede borrar fechas y queda auditado", async () => {
    const coordinator = await person(["coordinator"]);
    const project = await createProject(coordinator, { startDate: "2026-11-01" });

    const edited = await send(coordinator, "PATCH", `/projects/${project.id}`, {
      name: "Nombre actualizado",
      description: "Nueva descripcion",
      startDate: null,
    });
    const methodology = await send(coordinator, "PATCH", `/projects/${project.id}`, { methodology: "traditional" });
    const audit = await h.dataSource.getRepository(AuditEvent).findOneByOrFail({ action: "project.updated", targetId: project.id });

    assert.equal(edited.json.name, "Nombre actualizado");
    assert.equal(edited.json.startDate, null);
    // El cambio de metodologia tiene reglas propias (F2-19) y no se acepta en la edicion general.
    assert.equal(methodology.response.status, 400);
    assert.deepEqual(JSON.parse(audit.details!).fields.sort(), ["description", "name", "startDate"]);
  });

  it("valida el identificador de proyecto", async () => {
    const coordinator = await person(["coordinator"]);

    assert.equal((await h.request("/projects/no-es-uuid", { cookies: coordinator.cookies })).response.status, 400);
    assert.equal((await h.request(`/projects/${randomUUID()}`, { cookies: coordinator.cookies })).response.status, 404);
  });
});
