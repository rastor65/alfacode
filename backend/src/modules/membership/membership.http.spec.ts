import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { hashToken } from "../../common/tokens";
import { AuditEvent } from "../audit/audit-event.entity";
import { REGISTRATION_ACCEPTED_MESSAGE, REGISTRATION_RATE_LIMITS } from "../auth/registration.service";
import { MAILER } from "../mail/mailer";
import type { MemoryMailer } from "../mail/mailers";
import { User } from "../users/user.entity";
import { type HttpHarness, PASSWORD, cookiePairs, startHttpHarness } from "../../testing/http-harness";
import { Invitation } from "./invitation.entity";
import { MembershipRequest } from "./membership-request.entity";

const NEW_PASSWORD = "Clave-Nueva-Ficticia-2026";
const TEMPORARY_PASSWORD = /Contrasena temporal: ([A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4})/;

let h: HttpHarness;
let mailer: MemoryMailer;

function lastTokenSentTo(email: string) {
  const message = [...mailer.messages].reverse().find((item) => item.to === email);
  const token = message?.text.match(/#token=([A-Za-z0-9_-]{43})/)?.[1];
  assert.ok(token, `no hay enlace con token para ${email}`);
  return token;
}

function lastTemporaryPasswordSentTo(email: string) {
  const message = [...mailer.messages].reverse().find((item) => item.to === email);
  const password = message?.text.match(TEMPORARY_PASSWORD)?.[1];
  assert.ok(password, `no hay contrasena temporal para ${email}`);
  return password;
}

async function register(email: string, extra: Record<string, unknown> = {}) {
  return h.request("/auth/register", {
    method: "POST",
    body: { fullName: "Persona Ficticia", email, ...extra },
  });
}

async function registered(email: string) {
  assert.equal((await register(email)).response.status, 202);
  return h.dataSource.getRepository(MembershipRequest).findOneOrFail({
    where: { user: { emailNormalized: email } },
    relations: { user: true },
  });
}

async function authority(email: string, role: "admin" | "coordinator" | "student") {
  await h.createUser(email, { roles: [role] });
  return h.loginOk(email);
}

async function approve(session: { cookies: string[]; csrf: string }, requestId: string, roleCode = "student") {
  return h.request(`/membership-requests/${requestId}/approve`, {
    method: "POST",
    cookies: session.cookies,
    csrf: session.csrf,
    body: { roleCode },
  });
}

/** Solicitud aprobada: devuelve la contrasena temporal recibida por correo. */
async function approvedMember(email: string, roleCode = "student") {
  const admin = await authority(`admin-de-${email}`, "admin");
  const request = await registered(email);
  assert.equal((await approve(admin, request.id, roleCode)).response.status, 200);
  return lastTemporaryPasswordSentTo(email);
}

before(async () => {
  h = await startHttpHarness();
  mailer = h.app.get(MAILER);
});

after(async () => {
  await h?.close();
});

describe("POST /auth/register (solicitud sin contrasena)", () => {
  it("crea usuario y solicitud pendientes, sin contrasena utilizable y sin enviar correos", async () => {
    const before = mailer.messages.length;
    const { response, json } = await register("  Nueva@Uniguajira.EDU.CO ", { message: "Quiero participar" });
    const user = await h.dataSource.getRepository(User).findOneByOrFail({ emailNormalized: "nueva@uniguajira.edu.co" });
    const request = await h.dataSource.getRepository(MembershipRequest).findOneByOrFail({ userId: user.id });

    assert.equal(response.status, 202);
    assert.deepEqual(json, { message: REGISTRATION_ACCEPTED_MESSAGE });
    assert.equal(user.accountStatus, "pending");
    assert.equal(user.emailVerifiedAt, null);
    assert.equal(user.mustChangePassword, false);
    assert.equal(request.status, "pending");
    assert.equal(request.message, "Quiero participar");
    assert.equal(mailer.messages.length, before);
  });

  it("crea usuario y solicitud con hoja de vida estructurada (cvData)", async () => {
    const cvData = {
      fechaElaboracion: "2026-10-13",
      nombres: "Estudiante",
      apellidos: "Prueba",
      documentoIdentidad: "1122334455",
      fechaNacimiento: "2003-05-15",
      nacionalidad: "Colombiana",
      celular: "3001234567",
      facultad: "Facultad de Ingeniería",
      programa: "Ingeniería de Sistemas",
      sede: "Riohacha",
      semestreActual: "6",
      promedioAcademico: "4.5",
      lineasInvestigacion: "Inteligencia Artificial",
      experienciaInvestigativa: "Participación en semillero escolar",
    };
    const { response, json } = await register("con-cv@uniguajira.edu.co", {
      fullName: "Estudiante Prueba",
      cvData,
    });
    assert.equal(response.status, 202);
    assert.deepEqual(json, { message: REGISTRATION_ACCEPTED_MESSAGE });

    const user = await h.dataSource.getRepository(User).findOneByOrFail({ emailNormalized: "con-cv@uniguajira.edu.co" });
    const request = await h.dataSource.getRepository(MembershipRequest).findOneByOrFail({ userId: user.id });
    assert.equal(request.status, "pending");
    assert.deepEqual(request.cvData, cvData);
  });

  it("ya no acepta una contrasena en la solicitud", async () => {
    const { response, json } = await register("con-clave@uniguajira.edu.co", { password: NEW_PASSWORD });

    assert.equal(response.status, 400);
    assert.equal(json.code, "VALIDATION_ERROR");
  });

  it("no revela si el correo ya existe", async () => {
    await h.createUser("existente@uniguajira.edu.co");

    const { response, json } = await register("existente@uniguajira.edu.co");
    const users = await h.dataSource.getRepository(User).countBy({ emailNormalized: "existente@uniguajira.edu.co" });

    assert.equal(response.status, 202);
    assert.deepEqual(json, { message: REGISTRATION_ACCEPTED_MESSAGE });
    assert.equal(users, 1);
  });

  it("rechaza campos protegidos", async () => {
    const { response } = await register("masiva@uniguajira.edu.co", { accountStatus: "active", roles: ["admin"] });

    assert.equal(response.status, 400);
    assert.equal(await h.dataSource.getRepository(User).countBy({ emailNormalized: "masiva@uniguajira.edu.co" }), 0);
  });

  it("una solicitud sin aprobar no permite iniciar sesion", async () => {
    await register("sin-aprobar@uniguajira.edu.co");

    const { response, json } = await h.login("sin-aprobar@uniguajira.edu.co", NEW_PASSWORD);

    assert.equal(response.status, 401);
    assert.equal(json.code, "INVALID_CREDENTIALS");
  });

  it("limita las solicitudes por IP", async () => {
    const ip = h.freshIp();

    for (let attempt = 0; attempt < REGISTRATION_RATE_LIMITS.registerPerIp.limit; attempt += 1) {
      const { response } = await h.request("/auth/register", {
        method: "POST",
        ip,
        body: { fullName: "Persona Ficticia", email: `masivo-${attempt}@uniguajira.edu.co` },
      });
      assert.equal(response.status, 202);
    }

    const blocked = await h.request("/auth/register", {
      method: "POST",
      ip,
      body: { fullName: "Persona Ficticia", email: "masivo-extra@uniguajira.edu.co" },
    });
    assert.equal(blocked.response.status, 429);
  });

  it("la verificacion de correo por enlace ya no existe", async () => {
    const { response } = await h.request("/auth/verify-email", { method: "POST", body: { token: "A".repeat(43) } });

    assert.equal(response.status, 404);
  });
});

describe("solicitudes de vinculacion", () => {
  it("solo admin y coordinator consultan o resuelven solicitudes, aunque se llame la API directamente", async () => {
    const student = await authority("estudiante-cola@uniguajira.edu.co", "student");
    const request = await registered("objetivo-estudiante@uniguajira.edu.co");

    const list = await h.request("/membership-requests", { cookies: student.cookies });
    const approval = await approve(student, request.id, "admin");
    const anonymous = await h.request("/membership-requests");

    assert.equal(list.response.status, 403);
    assert.equal(approval.response.status, 403);
    assert.equal(anonymous.response.status, 401);
  });

  it("lista solicitudes pendientes paginadas sin datos sensibles", async () => {
    const coordinator = await authority("coord-lista@uniguajira.edu.co", "coordinator");
    await registered("en-cola@uniguajira.edu.co");

    const { response, json, text } = await h.request("/membership-requests?page=1&pageSize=100", {
      cookies: coordinator.cookies,
    });
    const item = json.items.find((entry: { user: { email: string } }) => entry.user.email === "en-cola@uniguajira.edu.co");

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(json).sort(), ["items", "page", "pageSize", "total"]);
    assert.equal(item.status, "pending");
    assert.doesNotMatch(text, /passwordHash|password_hash|argon2|tokenHash/);
    assert.equal((await h.request("/membership-requests?pageSize=500", { cookies: coordinator.cookies })).response.status, 400);
  });

  it("el coordinador no puede conceder admin ni coordinator", async () => {
    const coordinator = await authority("coord-limites@uniguajira.edu.co", "coordinator");
    const request = await registered("quiere-admin@uniguajira.edu.co");

    for (const roleCode of ["admin", "coordinator"]) {
      const { response, json } = await approve(coordinator, request.id, roleCode);
      assert.equal(response.status, 403, roleCode);
      assert.equal(json.code, "ROLE_NOT_ASSIGNABLE");
    }
  });

  it("aprobar activa la cuenta, asigna el rol y envia una contrasena temporal que no queda en la auditoria", async () => {
    const coordinator = await authority("coord-aprueba@uniguajira.edu.co", "coordinator");
    const request = await registered("aprobada@uniguajira.edu.co");

    const approved = await h.request(`/membership-requests/${request.id}/approve`, {
      method: "POST",
      cookies: coordinator.cookies,
      csrf: coordinator.csrf,
      body: { roleCode: "researcher", comment: "Bienvenida al semillero" },
    });
    const again = await approve(coordinator, request.id);
    const temporaryPassword = lastTemporaryPasswordSentTo("aprobada@uniguajira.edu.co");
    const user = await h.dataSource.getRepository(User).findOneOrFail({
      where: { id: request.userId },
      relations: { roles: true },
    });
    const audit = await h.dataSource
      .getRepository(AuditEvent)
      .findOneByOrFail({ action: "membership_request.approved", targetId: request.userId });

    assert.equal(approved.response.status, 200, approved.text);
    assert.equal(approved.json.status, "approved");
    assert.equal(approved.json.approvedRole, "researcher");
    assert.equal(approved.json.credentials.delivery, "email");
    assert.equal(approved.json.credentials.temporaryPassword, undefined);
    assert.doesNotMatch(approved.text, new RegExp(temporaryPassword));
    assert.equal(again.json.code, "REQUEST_ALREADY_RESOLVED");
    assert.equal(user.accountStatus, "active");
    assert.equal(user.mustChangePassword, true);
    assert.ok(user.passwordExpiresAt && user.passwordExpiresAt.getTime() > Date.now());
    assert.deepEqual(user.roles.map((role) => role.code), ["researcher"]);
    assert.doesNotMatch(audit.details ?? "", new RegExp(temporaryPassword));
    assert.match(mailer.messages.at(-1)!.text, /http:\/\/localhost:3000\/ingresar/);
  });

  it("el rechazo deja la cuenta rechazada y sin acceso", async () => {
    const admin = await authority("admin-rechaza@uniguajira.edu.co", "admin");
    const request = await registered("rechazada@uniguajira.edu.co");

    const rejected = await h.request(`/membership-requests/${request.id}/reject`, {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: { comment: "Fuera del alcance" },
    });
    const again = await h.request(`/membership-requests/${request.id}/reject`, {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: {},
    });

    assert.equal(rejected.response.status, 200);
    assert.equal(rejected.json.status, "rejected");
    assert.equal(again.response.status, 409);
  });

  it("valida el identificador de la solicitud", async () => {
    const admin = await authority("admin-uuid@uniguajira.edu.co", "admin");

    const invalid = await h.request("/membership-requests/no-es-uuid/reject", {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: {},
    });
    const missing = await h.request("/membership-requests/00000000-0000-4000-8000-000000000000/reject", {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: {},
    });

    assert.equal(invalid.response.status, 400);
    assert.equal(missing.response.status, 404);
  });
});

describe("primer ingreso con contrasena temporal", () => {
  it("verifica el correo y obliga a cambiar la contrasena antes de cualquier otra accion", async () => {
    const temporaryPassword = await approvedMember("primer-ingreso@uniguajira.edu.co");

    const login = await h.login("primer-ingreso@uniguajira.edu.co", temporaryPassword);
    const session = { cookies: cookiePairs(login.response), csrf: login.json.csrfToken as string };
    const user = await h.dataSource.getRepository(User).findOneByOrFail({ emailNormalized: "primer-ingreso@uniguajira.edu.co" });
    const me = await h.request("/auth/me", { cookies: session.cookies });
    const members = await h.request("/users", { cookies: session.cookies });
    const profile = await h.request("/users/me", { cookies: session.cookies });

    assert.equal(login.response.status, 200, login.text);
    assert.equal(login.json.user.mustChangePassword, true);
    assert.notEqual(user.emailVerifiedAt, null);
    assert.equal(me.response.status, 200);
    assert.equal(members.response.status, 403);
    assert.equal(members.json.code, "PASSWORD_CHANGE_REQUIRED");
    assert.equal(profile.json.code, "PASSWORD_CHANGE_REQUIRED");
  });

  it("al cambiarla se habilita la cuenta, la temporal deja de servir y se cierran las demas sesiones", async () => {
    const temporaryPassword = await approvedMember("cambia@uniguajira.edu.co");
    const first = await h.loginOk("cambia@uniguajira.edu.co", temporaryPassword);
    const second = await h.loginOk("cambia@uniguajira.edu.co", temporaryPassword);
    const change = (currentPassword: string, newPassword: string) =>
      h.request("/auth/change-password", {
        method: "POST",
        cookies: first.cookies,
        csrf: first.csrf,
        body: { currentPassword, newPassword },
      });

    const wrongCurrent = await change("incorrecta", NEW_PASSWORD);
    const unchanged = await change(temporaryPassword, temporaryPassword);
    const tooShort = await change(temporaryPassword, "corta");
    const changed = await change(temporaryPassword, NEW_PASSWORD);
    const audit = await h.dataSource.getRepository(AuditEvent).findOneByOrFail({ action: "user.password_changed" });

    assert.equal(wrongCurrent.json.code, "INVALID_CURRENT_PASSWORD");
    assert.equal(unchanged.json.code, "PASSWORD_UNCHANGED");
    assert.equal(tooShort.json.code, "VALIDATION_ERROR");
    assert.equal(changed.response.status, 200, changed.text);
    assert.equal(changed.json.mustChangePassword, false);
    assert.equal((await h.request("/users", { cookies: first.cookies })).response.status, 200);
    assert.equal((await h.request("/auth/me", { cookies: second.cookies })).response.status, 401);
    assert.equal((await h.login("cambia@uniguajira.edu.co", temporaryPassword)).response.status, 401);
    assert.equal((await h.login("cambia@uniguajira.edu.co", NEW_PASSWORD)).response.status, 200);
    assert.doesNotMatch(audit.details ?? "", new RegExp(temporaryPassword));
  });

  it("el cambio de contrasena exige sesion y CSRF", async () => {
    const temporaryPassword = await approvedMember("csrf-cambio@uniguajira.edu.co");
    const session = await h.loginOk("csrf-cambio@uniguajira.edu.co", temporaryPassword);
    const body = { currentPassword: temporaryPassword, newPassword: NEW_PASSWORD };

    assert.equal((await h.request("/auth/change-password", { method: "POST", body })).response.status, 401);
    assert.equal(
      (await h.request("/auth/change-password", { method: "POST", cookies: session.cookies, body })).json.code,
      "CSRF_TOKEN_INVALID",
    );
  });

  it("limita los intentos fallidos con la contrasena actual", async () => {
    const temporaryPassword = await approvedMember("limite-cambio@uniguajira.edu.co");
    const session = await h.loginOk("limite-cambio@uniguajira.edu.co", temporaryPassword);
    const attempt = (currentPassword: string) =>
      h.request("/auth/change-password", {
        method: "POST",
        cookies: session.cookies,
        csrf: session.csrf,
        body: { currentPassword, newPassword: NEW_PASSWORD },
      });

    for (let index = 0; index < 5; index += 1) {
      assert.equal((await attempt("incorrecta")).response.status, 400);
    }

    assert.equal((await attempt(temporaryPassword)).response.status, 429);
  });

  it("la contrasena temporal vencida no permite ingresar", async () => {
    const temporaryPassword = await approvedMember("vencida-temp@uniguajira.edu.co");
    await h.dataSource.query(
      "UPDATE users SET password_expires_at = datetime('now', '-1 minute') WHERE email_normalized = ?",
      ["vencida-temp@uniguajira.edu.co"],
    );

    const { response, json } = await h.login("vencida-temp@uniguajira.edu.co", temporaryPassword);

    assert.equal(response.status, 403);
    assert.equal(json.code, "TEMPORARY_PASSWORD_EXPIRED");
  });

  it("la recuperacion de contrasena sirve aunque no haya ingresado nunca", async () => {
    await approvedMember("recupera-temp@uniguajira.edu.co");

    await h.request("/auth/forgot-password", { method: "POST", body: { email: "recupera-temp@uniguajira.edu.co" } });
    const reset = await h.request("/auth/reset-password", {
      method: "POST",
      body: { token: lastTokenSentTo("recupera-temp@uniguajira.edu.co"), password: NEW_PASSWORD },
    });
    const login = await h.login("recupera-temp@uniguajira.edu.co", NEW_PASSWORD);

    assert.equal(reset.response.status, 200, reset.text);
    assert.equal(login.response.status, 200);
    assert.equal(login.json.user.mustChangePassword, false);
  });
});

describe("regenerar la contrasena temporal", () => {
  it("si el correo de aprobacion falla, la cuenta queda aprobada y se puede regenerar", async () => {
    const admin = await authority("admin-regenera@uniguajira.edu.co", "admin");
    const request = await registered("sin-correo@uniguajira.edu.co");
    mailer.failNext = new Error("smtp caido");

    const approved = await approve(admin, request.id);
    const reissued = await h.request(`/users/${request.userId}/temporary-password`, {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
    });
    const temporaryPassword = lastTemporaryPasswordSentTo("sin-correo@uniguajira.edu.co");

    assert.equal(approved.response.status, 200);
    assert.equal(approved.json.status, "approved");
    assert.equal(approved.json.credentials.delivery, "failed");
    assert.equal(reissued.response.status, 200, reissued.text);
    assert.equal(reissued.json.credentials.delivery, "email");
    assert.equal(reissued.json.mustChangePassword, true);
    assert.equal((await h.login("sin-correo@uniguajira.edu.co", temporaryPassword)).response.status, 200);
  });

  it("solo autoridades, sobre cuentas activas y nunca sobre la propia", async () => {
    const coordinator = await authority("coord-regenera@uniguajira.edu.co", "coordinator");
    const student = await authority("estudiante-regenera@uniguajira.edu.co", "student");
    const admin = await h.createUser("admin-protegido-regenera@uniguajira.edu.co", { roles: ["admin"] });
    const pending = await h.createUser("pendiente-regenera@uniguajira.edu.co", { status: "pending" });
    const reissue = (session: { cookies: string[]; csrf: string }, id: string) =>
      h.request(`/users/${id}/temporary-password`, { method: "POST", cookies: session.cookies, csrf: session.csrf });
    const self = await h.dataSource.getRepository(User).findOneByOrFail({ emailNormalized: "coord-regenera@uniguajira.edu.co" });

    assert.equal((await reissue(student, admin.id)).response.status, 403);
    assert.equal((await reissue(coordinator, admin.id)).json.code, "USER_NOT_MANAGEABLE");
    assert.equal((await reissue(coordinator, self.id)).json.code, "CANNOT_RESET_OWN_PASSWORD");
    assert.equal((await reissue(coordinator, pending.id)).json.code, "INVALID_ACCOUNT_STATUS");
  });
});

describe("invitaciones", () => {
  async function invite(session: { cookies: string[]; csrf: string }, email: string, roleCode = "student") {
    return h.request("/invitations", {
      method: "POST",
      cookies: session.cookies,
      csrf: session.csrf,
      body: { email, roleCode },
    });
  }

  async function accept(token: string, password = NEW_PASSWORD) {
    return h.request("/invitations/accept", {
      method: "POST",
      body: { token, fullName: "Persona Invitada", password },
    });
  }

  it("solo autoridades invitan y el coordinador no puede invitar administradores", async () => {
    const student = await authority("estudiante-invita@uniguajira.edu.co", "student");
    const coordinator = await authority("coord-invita@uniguajira.edu.co", "coordinator");

    assert.equal((await invite(student, "x@uniguajira.edu.co")).response.status, 403);
    assert.equal((await invite(coordinator, "x@uniguajira.edu.co", "admin")).json.code, "ROLE_NOT_ASSIGNABLE");
    assert.equal((await invite(coordinator, "x@uniguajira.edu.co", "coordinator")).response.status, 403);
  });

  it("el enlace sirve una sola vez y crea una cuenta activa con el rol autorizado", async () => {
    const admin = await authority("admin-invita@uniguajira.edu.co", "admin");

    const created = await invite(admin, "Invitada@Uniguajira.EDU.CO", "teacher_leader");
    const token = lastTokenSentTo("invitada@uniguajira.edu.co");
    const first = await accept(token);
    const second = await accept(token);
    const session = await h.loginOk("invitada@uniguajira.edu.co", NEW_PASSWORD);
    const me = await h.request("/auth/me", { cookies: session.cookies });
    const requests = await h.dataSource
      .getRepository(MembershipRequest)
      .countBy({ user: { emailNormalized: "invitada@uniguajira.edu.co" } });

    assert.equal(created.response.status, 201, created.text);
    assert.equal(created.json.delivery, "email");
    assert.equal(created.json.acceptUrl, undefined);
    assert.match(mailer.messages.at(-1)?.text ?? "", /invitacion#token=/);
    assert.equal(first.response.status, 201, first.text);
    assert.equal(second.response.status, 400);
    assert.equal(second.json.code, "INVALID_TOKEN");
    assert.deepEqual(me.json.roles, ["teacher_leader"]);
    assert.equal(me.json.accountStatus, "active");
    assert.equal(requests, 0);
  });

  it("rechaza enlaces vencidos", async () => {
    const admin = await authority("admin-vencida@uniguajira.edu.co", "admin");
    await invite(admin, "vencida@uniguajira.edu.co");
    const token = lastTokenSentTo("vencida@uniguajira.edu.co");
    await h.dataSource.query(
      "UPDATE invitations SET expires_at = datetime('now', '-1 minute') WHERE email_normalized = ?",
      ["vencida@uniguajira.edu.co"],
    );

    const { response, json } = await accept(token);

    assert.equal(response.status, 400);
    assert.equal(json.code, "INVALID_TOKEN");
  });

  it("una nueva invitacion invalida el enlace anterior", async () => {
    const admin = await authority("admin-reinvita@uniguajira.edu.co", "admin");
    await invite(admin, "reinvitada@uniguajira.edu.co");
    const oldToken = lastTokenSentTo("reinvitada@uniguajira.edu.co");
    await invite(admin, "reinvitada@uniguajira.edu.co");
    const newToken = lastTokenSentTo("reinvitada@uniguajira.edu.co");

    assert.equal((await accept(oldToken)).response.status, 400);
    assert.equal((await accept(newToken)).response.status, 201);
  });

  it("no invita correos que ya tienen cuenta", async () => {
    const admin = await authority("admin-existente@uniguajira.edu.co", "admin");
    await h.createUser("ya-tiene-cuenta@uniguajira.edu.co");

    const { response, json } = await invite(admin, "ya-tiene-cuenta@uniguajira.edu.co");

    assert.equal(response.status, 409);
    assert.equal(json.code, "EMAIL_ALREADY_REGISTERED");
  });

  it("no guarda el token en claro ni lo expone en la auditoria", async () => {
    const admin = await authority("admin-hash@uniguajira.edu.co", "admin");
    const created = await invite(admin, "hash@uniguajira.edu.co");
    const token = lastTokenSentTo("hash@uniguajira.edu.co");
    const stored = await h.dataSource.getRepository(Invitation).findOneByOrFail({ id: created.json.id });
    const audit = await h.dataSource.getRepository(AuditEvent).findOneByOrFail({ targetId: created.json.id });

    assert.notEqual(stored.tokenHash, token);
    assert.doesNotMatch(audit.details ?? "", new RegExp(token));
  });
});

describe("fallo al enviar el correo de invitacion", () => {
  it("la invitacion queda revocada si no se pudo enviar", async () => {
    const admin = await authority("admin-falla@uniguajira.edu.co", "admin");
    mailer.failNext = new Error("smtp caido");

    const failed = await h.request("/invitations", {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: { email: "invitacion-falla@uniguajira.edu.co", roleCode: "student" },
    });
    const stored = await h.dataSource.getRepository(Invitation).findOneByOrFail({
      emailNormalized: "invitacion-falla@uniguajira.edu.co",
    });
    const retried = await h.request("/invitations", {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: { email: "invitacion-falla@uniguajira.edu.co", roleCode: "student" },
    });

    assert.equal(failed.response.status, 503);
    assert.equal(failed.json.code, "MAIL_DELIVERY_FAILED");
    assert.notEqual(stored.revokedAt, null);
    assert.equal(retried.response.status, 201);
  });
});

describe("sin transporte de correo (MAIL_TRANSPORT=none)", () => {
  let noMail: HttpHarness;

  before(async () => {
    noMail = await startHttpHarness({ env: { MAIL_TRANSPORT: "none" } });
  });

  after(async () => {
    await noMail?.close();
    // El arnes principal se creo con correo en memoria; se restablece para las demas pruebas.
    process.env.MAIL_TRANSPORT = "memory";
  });

  it("deshabilita las solicitudes publicas", async () => {
    const { response, json } = await noMail.request("/auth/register", {
      method: "POST",
      body: { fullName: "Persona Ficticia", email: "sin-correo@uniguajira.edu.co" },
    });

    assert.equal(response.status, 503);
    assert.equal(json.code, "REGISTRATION_DISABLED");
  });

  it("al regenerar, muestra la contrasena temporal una sola vez a quien la genera", async () => {
    await noMail.createUser("admin-manual@uniguajira.edu.co", { roles: ["admin"] });
    const target = await noMail.createUser("persona-manual@uniguajira.edu.co");
    const admin = await noMail.loginOk("admin-manual@uniguajira.edu.co", PASSWORD);

    const reissued = await noMail.request(`/users/${target.id}/temporary-password`, {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
    });
    const login = await noMail.login("persona-manual@uniguajira.edu.co", reissued.json.credentials.temporaryPassword);

    assert.equal(reissued.response.status, 200);
    assert.equal(reissued.json.credentials.delivery, "manual");
    assert.equal(reissued.response.headers.get("cache-control"), "no-store");
    assert.equal(login.response.status, 200);
    assert.equal(login.json.user.mustChangePassword, true);
  });

  it("muestra el enlace de invitacion una sola vez a quien invita", async () => {
    const admin = await noMail.loginOk("admin-manual@uniguajira.edu.co", PASSWORD);

    const created = await noMail.request("/invitations", {
      method: "POST",
      cookies: admin.cookies,
      csrf: admin.csrf,
      body: { email: "manual@uniguajira.edu.co", roleCode: "student" },
    });
    const token = created.json.acceptUrl.match(/#token=([A-Za-z0-9_-]{43})/)[1];
    const accepted = await noMail.request("/invitations/accept", {
      method: "POST",
      body: { token, fullName: "Persona Manual", password: NEW_PASSWORD },
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.json.delivery, "manual");
    assert.equal(accepted.response.status, 201);
  });
});

describe("solo correos @uniguajira.edu.co", () => {
  const EXTERNAL = ["persona@gmail.com", "persona@estudiantes.uniguajira.edu.co", "persona@uniguajira.edu.co.evil.com"];

  it("el registro rechaza otros dominios sin crear cuenta ni enviar correo", async () => {
    for (const email of EXTERNAL) {
      const before = mailer.messages.length;
      const { response, json } = await register(email);

      assert.equal(response.status, 400, email);
      assert.equal(json.code, "EMAIL_DOMAIN_NOT_ALLOWED");
      assert.equal(mailer.messages.length, before);
      assert.equal(await h.dataSource.getRepository(User).countBy({ emailNormalized: email }), 0);
    }
  });

  it("no se puede invitar a otros dominios", async () => {
    const admin = await authority("admin-dominio@uniguajira.edu.co", "admin");

    for (const email of EXTERNAL) {
      const { response, json } = await h.request("/invitations", {
        method: "POST",
        cookies: admin.cookies,
        csrf: admin.csrf,
        body: { email, roleCode: "student" },
      });
      assert.equal(response.status, 400, email);
      assert.equal(json.code, "EMAIL_DOMAIN_NOT_ALLOWED");
    }
  });

  it("una cuenta fuera del dominio no puede iniciar sesion aunque exista", async () => {
    await h.createUser("heredada@gmail.com");

    const { response, json } = await h.login("heredada@gmail.com");

    assert.equal(response.status, 400);
    assert.equal(json.code, "EMAIL_DOMAIN_NOT_ALLOWED");
  });

  it("una invitacion emitida antes de restringir el dominio ya no se acepta", async () => {
    const token = "B".repeat(43);
    const role = await h.dataSource.query("SELECT id FROM roles WHERE code = 'student'");
    await h.dataSource.query(
      "INSERT INTO invitations (id, email_normalized, role_id, token_hash, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+1 day'))",
      [
        "11111111-1111-4111-8111-111111111111",
        "antigua@gmail.com",
        role[0].id,
        hashToken(token),
      ],
    );

    const { response, json } = await h.request("/invitations/accept", {
      method: "POST",
      body: { token, fullName: "Persona Antigua", password: NEW_PASSWORD },
    });

    assert.equal(response.status, 400);
    assert.equal(json.code, "EMAIL_DOMAIN_NOT_ALLOWED");
    assert.equal(await h.dataSource.getRepository(User).countBy({ emailNormalized: "antigua@gmail.com" }), 0);
  });
});
