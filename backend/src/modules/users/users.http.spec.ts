import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

import { ApiError } from "../../common/api-error";
import { type HttpHarness, PASSWORD, startHttpHarness } from "../../testing/http-harness";
import { AuditEvent } from "../audit/audit-event.entity";
import { PASSWORD_RESET_RATE_LIMITS, PASSWORD_RESET_REQUESTED_MESSAGE } from "../auth/password-reset.service";
import { MAILER } from "../mail/mailer";
import type { MemoryMailer } from "../mail/mailers";
import { Role, type RoleCode } from "../roles/role.entity";
import { MembersService } from "./members.service";
import { User } from "./user.entity";

const NEW_PASSWORD = "Clave-Restablecida-2026";

let h: HttpHarness;
let mailer: MemoryMailer;

type Session = { cookies: string[]; csrf: string };

async function userWithSession(email: string, roles: RoleCode[] = ["student"]) {
  const user = await h.createUser(email, { roles });
  return { user, session: await h.loginOk(email) };
}

function send(session: Session, method: string, path: string, body?: unknown) {
  return h.request(path, { method, cookies: session.cookies, csrf: session.csrf, body });
}

function lastResetToken(email: string) {
  const message = [...mailer.messages].reverse().find((item) => item.to === email);
  const token = message?.text.match(/restablecer-contrasena#token=([A-Za-z0-9_-]{43})/)?.[1];
  assert.ok(token, `no hay enlace de recuperacion para ${email}`);
  return token;
}

function forgot(email: string, ip?: string) {
  return h.request("/auth/forgot-password", { method: "POST", body: { email }, ip });
}

function reset(token: string, password = NEW_PASSWORD) {
  return h.request("/auth/reset-password", { method: "POST", body: { token, password } });
}

before(async () => {
  h = await startHttpHarness();
  mailer = h.app.get(MAILER);
});

after(async () => {
  await h?.close();
});

describe("recuperacion de contrasena (F1-06)", () => {
  it("responde igual exista o no la cuenta y solo envia correo a cuentas activas", async () => {
    await h.createUser("recupera@uniguajira.edu.co");
    await h.createUser("pendiente-rec@uniguajira.edu.co", { status: "pending", verified: false });
    const before = mailer.messages.length;

    const existing = await forgot("Recupera@Uniguajira.edu.co");
    const unknown = await forgot("no-existe@uniguajira.edu.co");
    const pending = await forgot("pendiente-rec@uniguajira.edu.co");

    for (const result of [existing, unknown, pending]) {
      assert.equal(result.response.status, 202);
      assert.deepEqual(result.json, { message: PASSWORD_RESET_REQUESTED_MESSAGE });
    }
    assert.equal(mailer.messages.length, before + 1);
    assert.equal(mailer.messages.at(-1)!.to, "recupera@uniguajira.edu.co");
    assert.match(mailer.messages.at(-1)!.text, /restablecer-contrasena#token=/);
  });

  it("cambiar la contrasena invalida todas las sesiones anteriores", async () => {
    const { session } = await userWithSession("sesiones-rec@uniguajira.edu.co");
    const other = await h.loginOk("sesiones-rec@uniguajira.edu.co");

    await forgot("sesiones-rec@uniguajira.edu.co");
    const result = await reset(lastResetToken("sesiones-rec@uniguajira.edu.co"));

    assert.equal(result.response.status, 200);
    assert.equal((await h.request("/auth/me", { cookies: session.cookies })).response.status, 401);
    assert.equal((await h.request("/auth/me", { cookies: other.cookies })).response.status, 401);
    assert.equal((await h.login("sesiones-rec@uniguajira.edu.co", PASSWORD)).response.status, 401);
    assert.equal((await h.login("sesiones-rec@uniguajira.edu.co", NEW_PASSWORD)).response.status, 200);
  });

  it("el enlace sirve una vez y una nueva solicitud invalida la anterior", async () => {
    await h.createUser("uso-unico@uniguajira.edu.co");
    await forgot("uso-unico@uniguajira.edu.co");
    const first = lastResetToken("uso-unico@uniguajira.edu.co");
    await forgot("uso-unico@uniguajira.edu.co");
    const second = lastResetToken("uso-unico@uniguajira.edu.co");

    assert.equal((await reset(first)).json.code, "INVALID_TOKEN");
    assert.equal((await reset(second)).response.status, 200);
    assert.equal((await reset(second, "Otra-Clave-Distinta-1")).response.status, 400);
  });

  it("rechaza enlaces vencidos y contrasenas cortas", async () => {
    const user = await h.createUser("vence-rec@uniguajira.edu.co");
    await forgot("vence-rec@uniguajira.edu.co");
    const token = lastResetToken("vence-rec@uniguajira.edu.co");

    const short = await reset(token, "corta");
    await h.dataSource.query(
      "UPDATE verification_tokens SET expires_at = datetime('now', '-1 minute') WHERE user_id = ? AND purpose = 'password_reset'",
      [user.id],
    );
    const expired = await reset(token);

    assert.equal(short.response.status, 400);
    assert.equal(short.json.code, "VALIDATION_ERROR");
    assert.equal(expired.response.status, 400);
    assert.equal(expired.json.code, "INVALID_TOKEN");
  });

  it("limita las solicitudes por cuenta para no inundar el buzon", async () => {
    await h.createUser("buzon@uniguajira.edu.co");

    for (let attempt = 0; attempt < PASSWORD_RESET_RATE_LIMITS.requestPerAccount.limit; attempt += 1) {
      assert.equal((await forgot("buzon@uniguajira.edu.co")).response.status, 202);
    }

    assert.equal((await forgot("buzon@uniguajira.edu.co")).response.status, 429);
  });

  it("solo admite correos institucionales", async () => {
    const { response, json } = await forgot("persona@gmail.com");

    assert.equal(response.status, 400);
    assert.equal(json.code, "EMAIL_DOMAIN_NOT_ALLOWED");
  });

  it("se audita sin exponer el token", async () => {
    const user = await h.createUser("audita-rec@uniguajira.edu.co");
    await forgot("audita-rec@uniguajira.edu.co");
    const token = lastResetToken("audita-rec@uniguajira.edu.co");
    await reset(token);

    const audit = await h.dataSource
      .getRepository(AuditEvent)
      .findOneByOrFail({ action: "user.password_reset", targetId: user.id });

    assert.doesNotMatch(audit.details ?? "", new RegExp(token));
  });
});

describe("perfil propio (F1-12)", () => {
  it("consulta y edita el nombre", async () => {
    const { session } = await userWithSession("perfil@uniguajira.edu.co");

    const profile = await h.request("/users/me", { cookies: session.cookies });
    const updated = await send(session, "PATCH", "/users/me", { fullName: "  Nombre Actualizado  " });

    assert.equal(profile.response.status, 200);
    assert.deepEqual(Object.keys(profile.json).sort(), [
      "accountStatus",
      "createdAt",
      "email",
      "emailVerified",
      "fullName",
      "id",
      "mustChangePassword",
      "roles",
    ]);
    assert.equal(updated.response.status, 200);
    assert.equal(updated.json.fullName, "Nombre Actualizado");
  });

  it("nadie cambia su propio rol, estado ni verificacion desde el perfil", async () => {
    const { user, session } = await userWithSession("perfil-protegido@uniguajira.edu.co");

    for (const extra of [{ roles: ["admin"] }, { accountStatus: "active" }, { emailVerifiedAt: null }, { email: "x@uniguajira.edu.co" }]) {
      const { response, json } = await send(session, "PATCH", "/users/me", { fullName: "Intento", ...extra });
      assert.equal(response.status, 400, JSON.stringify(extra));
      assert.equal(json.code, "VALIDATION_ERROR");
    }

    const stored = await h.dataSource.getRepository(User).findOneOrFail({ where: { id: user.id }, relations: { roles: true } });
    assert.equal(stored.fullName, "Persona Ficticia");
    assert.deepEqual(stored.roles.map((role) => role.code), ["student"]);
  });

  it("exige sesion y CSRF", async () => {
    const { session } = await userWithSession("perfil-csrf@uniguajira.edu.co");

    assert.equal((await h.request("/users/me")).response.status, 401);
    assert.equal(
      (await h.request("/users/me", { method: "PATCH", cookies: session.cookies, body: { fullName: "Sin CSRF" } })).response
        .status,
      403,
    );
  });
});

describe("listado de integrantes (F1-13)", () => {
  it("un integrante ve solo activos con id, nombre y roles", async () => {
    const { session } = await userWithSession("mira-lista@uniguajira.edu.co");
    await h.createUser("inactivo-lista@uniguajira.edu.co", { status: "inactive" });

    const { response, json, text } = await h.request("/users?pageSize=100", { cookies: session.cookies });
    const forbidden = await h.request("/users?status=inactive", { cookies: session.cookies });

    assert.equal(response.status, 200);
    assert.ok(json.items.length > 0);
    for (const item of json.items) {
      assert.deepEqual(Object.keys(item).sort(), ["fullName", "id", "roles"]);
    }
    assert.doesNotMatch(text, /uniguajira\.edu\.co|passwordHash|argon2/);
    assert.equal(forbidden.response.status, 403);
  });

  it("busca por nombre de forma literal y filtra por rol", async () => {
    const { session } = await userWithSession("busca@uniguajira.edu.co");
    const target = await h.createUser("lider-buscado@uniguajira.edu.co", { roles: ["teacher_leader"] });
    await h.dataSource.getRepository(User).update({ id: target.id }, { fullName: "Ana Lider_Unica" });

    const byName = await h.request(`/users?q=${encodeURIComponent("lider_unica")}`, { cookies: session.cookies });
    const wildcard = await h.request(`/users?q=${encodeURIComponent("%")}`, { cookies: session.cookies });
    const byRole = await h.request("/users?role=teacher_leader&pageSize=100", { cookies: session.cookies });

    assert.deepEqual(byName.json.items.map((item: { id: string }) => item.id), [target.id]);
    assert.equal(wildcard.json.total, 0);
    assert.ok(byRole.json.items.every((item: { roles: string[] }) => item.roles.includes("teacher_leader")));
    assert.ok(byRole.json.items.some((item: { id: string }) => item.id === target.id));
  });

  it("las autoridades ven correo y estado, y pueden filtrar por estado", async () => {
    const { session } = await userWithSession("coord-lista@uniguajira.edu.co", ["coordinator"]);
    await h.createUser("pendiente-lista@uniguajira.edu.co", { status: "pending", verified: false });

    const { json } = await h.request("/users?status=pending&q=pendiente-lista", { cookies: session.cookies });

    assert.equal(json.total, 1);
    assert.equal(json.items[0].email, "pendiente-lista@uniguajira.edu.co");
    assert.equal(json.items[0].accountStatus, "pending");
    assert.equal(json.items[0].emailVerified, false);
  });

  it("el detalle es solo para autoridades", async () => {
    const student = await userWithSession("estudiante-detalle@uniguajira.edu.co");
    const admin = await userWithSession("admin-detalle@uniguajira.edu.co", ["admin"]);

    assert.equal((await h.request(`/users/${admin.user.id}`, { cookies: student.session.cookies })).response.status, 403);
    assert.equal((await h.request(`/users/${student.user.id}`, { cookies: admin.session.cookies })).json.email, "estudiante-detalle@uniguajira.edu.co");
    assert.equal((await h.request(`/users/${randomUUID()}`, { cookies: admin.session.cookies })).response.status, 404);
    assert.equal((await h.request("/users/no-es-uuid", { cookies: admin.session.cookies })).response.status, 400);
  });
});

describe("estado de integrantes (F1-13)", () => {
  it("desactivar revoca las sesiones de inmediato y se audita; reactivar devuelve el acceso", async () => {
    const admin = await userWithSession("admin-estado@uniguajira.edu.co", ["admin"]);
    const target = await userWithSession("desactivada@uniguajira.edu.co");

    const deactivated = await send(admin.session, "PATCH", `/users/${target.user.id}/status`, {
      status: "inactive",
      reason: "Termino su participacion",
    });
    const meAfter = await h.request("/auth/me", { cookies: target.session.cookies });
    const loginInactive = await h.login("desactivada@uniguajira.edu.co");
    const reactivated = await send(admin.session, "PATCH", `/users/${target.user.id}/status`, { status: "active" });
    const audit = await h.dataSource
      .getRepository(AuditEvent)
      .findOneByOrFail({ action: "user.status_changed", targetId: target.user.id });

    assert.equal(deactivated.response.status, 200, deactivated.text);
    assert.equal(deactivated.json.accountStatus, "inactive");
    assert.equal(meAfter.response.status, 401);
    assert.equal(loginInactive.response.status, 403);
    assert.equal(reactivated.json.accountStatus, "active");
    assert.equal((await h.login("desactivada@uniguajira.edu.co")).response.status, 200);
    assert.deepEqual(JSON.parse(audit.details!), {
      from: "active",
      to: "inactive",
      reason: "Termino su participacion",
      assignedRole: null,
      temporaryPassword: null,
    });
    assert.equal(audit.actorUserId, admin.user.id);
  });

  it("nadie cambia su propio estado y el coordinator no administra admins ni coordinators", async () => {
    const coordinator = await userWithSession("coord-estado@uniguajira.edu.co", ["coordinator"]);
    const admin = await h.createUser("admin-protegido@uniguajira.edu.co", { roles: ["admin"] });
    const peer = await h.createUser("coord-par@uniguajira.edu.co", { roles: ["coordinator"] });
    const student = await h.createUser("estudiante-estado@uniguajira.edu.co");

    const self = await send(coordinator.session, "PATCH", `/users/${coordinator.user.id}/status`, { status: "inactive" });
    const onAdmin = await send(coordinator.session, "PATCH", `/users/${admin.id}/status`, { status: "inactive" });
    const onPeer = await send(coordinator.session, "PATCH", `/users/${peer.id}/status`, { status: "inactive" });
    const onStudent = await send(coordinator.session, "PATCH", `/users/${student.id}/status`, { status: "inactive" });

    assert.equal(self.json.code, "CANNOT_CHANGE_OWN_STATUS");
    assert.equal(onAdmin.json.code, "USER_NOT_MANAGEABLE");
    assert.equal(onPeer.json.code, "USER_NOT_MANAGEABLE");
    assert.equal(onStudent.response.status, 200);
  });

  it("las cuentas pendientes se resuelven desde la cola de solicitudes", async () => {
    const admin = await userWithSession("admin-pendiente@uniguajira.edu.co", ["admin"]);
    const pending = await h.createUser("pendiente-estado@uniguajira.edu.co", { status: "pending", roles: [] });

    const { response, json } = await send(admin.session, "PATCH", `/users/${pending.id}/status`, { status: "active" });

    assert.equal(response.status, 409);
    assert.equal(json.code, "INVALID_STATUS_TRANSITION");
  });

  it("reactivar una solicitud rechazada exige un rol y envia una contrasena temporal", async () => {
    const admin = await userWithSession("admin-rechazo@uniguajira.edu.co", ["admin"]);
    const rejected = await h.createUser("rechazada-estado@uniguajira.edu.co", { status: "rejected", roles: [] });

    const withoutRole = await send(admin.session, "PATCH", `/users/${rejected.id}/status`, { status: "active" });
    const withRole = await send(admin.session, "PATCH", `/users/${rejected.id}/status`, {
      status: "active",
      roleCode: "researcher",
    });

    const temporaryPassword = [...mailer.messages]
      .reverse()
      .find((item) => item.to === "rechazada-estado@uniguajira.edu.co")
      ?.text.match(/Contrasena temporal: (\S+)/)?.[1];

    assert.equal(withoutRole.json.code, "ROLE_REQUIRED");
    assert.equal(withRole.response.status, 200, withRole.text);
    assert.deepEqual(withRole.json.roles, ["researcher"]);
    assert.equal(withRole.json.credentials.delivery, "email");
    assert.equal(withRole.json.mustChangePassword, true);
    assert.ok(temporaryPassword);
    assert.equal((await h.login("rechazada-estado@uniguajira.edu.co")).response.status, 401);
    assert.equal((await h.login("rechazada-estado@uniguajira.edu.co", temporaryPassword)).response.status, 200);
  });

  it("nunca deja el sistema sin un admin activo", async () => {
    // Por la API no se puede llegar a este caso (quien actua seria otro admin activo), asi
    // que se comprueba la defensa llamando al servicio con un actor que no esta en la base.
    await h.dataSource.query(
      "UPDATE users SET account_status = 'inactive' WHERE id IN (SELECT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = 'admin')",
    );
    // Con dos roles, quitar `admin` no choca con la regla de "al menos un rol".
    const lastAdmin = await h.createUser("ultimo-admin@uniguajira.edu.co", { roles: ["admin", "student"] });
    const adminRole = await h.dataSource.getRepository(Role).findOneByOrFail({ code: "admin" });
    const ghostActor = Object.assign(new User(), { id: randomUUID(), fullName: "Actor", roles: [adminRole] });
    const members = h.app.get(MembersService);

    const isLastAdmin = (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal((error.getResponse() as { code: string }).code, "LAST_ADMIN");
      return true;
    };

    await assert.rejects(members.updateStatus(ghostActor, lastAdmin.id, { status: "inactive" }), isLastAdmin);
    await assert.rejects(members.removeRole(ghostActor, lastAdmin.id, "admin"), isLastAdmin);

    // Con otro admin activo, ambas operaciones vuelven a estar permitidas.
    await h.createUser("otro-admin@uniguajira.edu.co", { roles: ["admin"] });
    assert.deepEqual((await members.removeRole(ghostActor, lastAdmin.id, "admin")).roles, ["student"]);
    assert.equal((await members.updateStatus(ghostActor, lastAdmin.id, { status: "inactive" })).accountStatus, "inactive");
  });
});

describe("roles de integrantes (F1-13)", () => {
  it("el coordinator asigna y retira roles permitidos, y queda auditado", async () => {
    const coordinator = await userWithSession("coord-roles@uniguajira.edu.co", ["coordinator"]);
    const target = await h.createUser("recibe-rol@uniguajira.edu.co");

    const added = await send(coordinator.session, "POST", `/users/${target.id}/roles`, { roleCode: "researcher" });
    const duplicate = await send(coordinator.session, "POST", `/users/${target.id}/roles`, { roleCode: "researcher" });
    const removed = await send(coordinator.session, "DELETE", `/users/${target.id}/roles/student`);
    const notAssigned = await send(coordinator.session, "DELETE", `/users/${target.id}/roles/teacher_leader`);
    const audits = await h.dataSource.getRepository(AuditEvent).findBy({ targetId: target.id });

    assert.equal(added.response.status, 201, added.text);
    assert.deepEqual(added.json.roles, ["researcher", "student"]);
    assert.equal(duplicate.json.code, "ROLE_ALREADY_ASSIGNED");
    assert.deepEqual(removed.json.roles, ["researcher"]);
    assert.equal(notAssigned.json.code, "ROLE_NOT_ASSIGNED");
    assert.deepEqual(audits.map((audit) => audit.action).sort(), ["user.role_assigned", "user.role_removed"]);
  });

  it("el coordinator no concede ni retira admin o coordinator, ni toca a sus pares", async () => {
    const coordinator = await userWithSession("coord-limites-rol@uniguajira.edu.co", ["coordinator"]);
    const student = await h.createUser("estudiante-limites@uniguajira.edu.co");
    const peer = await h.createUser("coord-par-rol@uniguajira.edu.co", { roles: ["coordinator", "researcher"] });

    assert.equal((await send(coordinator.session, "POST", `/users/${student.id}/roles`, { roleCode: "admin" })).json.code, "ROLE_NOT_ASSIGNABLE");
    assert.equal((await send(coordinator.session, "POST", `/users/${student.id}/roles`, { roleCode: "coordinator" })).response.status, 403);
    assert.equal((await send(coordinator.session, "DELETE", `/users/${peer.id}/roles/coordinator`)).response.status, 403);
    assert.equal((await send(coordinator.session, "DELETE", `/users/${peer.id}/roles/researcher`)).json.code, "USER_NOT_MANAGEABLE");
  });

  it("nadie cambia sus propios roles y un estudiante no puede asignar roles", async () => {
    const admin = await userWithSession("admin-propio@uniguajira.edu.co", ["admin"]);
    const student = await userWithSession("estudiante-roles@uniguajira.edu.co");

    const self = await send(admin.session, "POST", `/users/${admin.user.id}/roles`, { roleCode: "researcher" });
    const byStudent = await send(student.session, "POST", `/users/${admin.user.id}/roles`, { roleCode: "student" });

    assert.equal(self.json.code, "CANNOT_CHANGE_OWN_ROLES");
    assert.equal(byStudent.response.status, 403);
  });

  it("una cuenta activa conserva al menos un rol y se validan los roles desconocidos", async () => {
    const admin = await userWithSession("admin-ultimo-rol@uniguajira.edu.co", ["admin"]);
    const target = await h.createUser("un-rol@uniguajira.edu.co");

    const lastRole = await send(admin.session, "DELETE", `/users/${target.id}/roles/student`);
    const unknown = await send(admin.session, "DELETE", `/users/${target.id}/roles/superusuario`);

    assert.equal(lastRole.json.code, "ROLE_REQUIRED");
    assert.equal(unknown.response.status, 400);
  });

  it("los cambios de rol surten efecto en la siguiente peticion", async () => {
    const admin = await userWithSession("admin-efecto@uniguajira.edu.co", ["admin"]);
    const target = await userWithSession("ascendida@uniguajira.edu.co");

    assert.equal((await h.request("/membership-requests", { cookies: target.session.cookies })).response.status, 403);
    await send(admin.session, "POST", `/users/${target.user.id}/roles`, { roleCode: "coordinator" });
    assert.equal((await h.request("/membership-requests", { cookies: target.session.cookies })).response.status, 200);
  });
});

describe("recuperacion sin transporte de correo", () => {
  let noMail: HttpHarness;

  before(async () => {
    noMail = await startHttpHarness({ env: { MAIL_TRANSPORT: "none" } });
  });

  after(async () => {
    await noMail?.close();
    process.env.MAIL_TRANSPORT = "memory";
  });

  it("no se declara operativa", async () => {
    const { response, json } = await noMail.request("/auth/forgot-password", {
      method: "POST",
      body: { email: "persona@uniguajira.edu.co" },
    });

    assert.equal(response.status, 503);
    assert.equal(json.code, "PASSWORD_RESET_DISABLED");
  });
});
