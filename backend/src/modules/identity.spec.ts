import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import type { DataSource } from "typeorm";

import { seedRoles } from "../database/seeds/roles.seed";
import { createTestDataSource } from "../database/test-data-source";
import { Session } from "./auth/session.entity";
import { SESSION_TTL_MS, SessionsService, hashSessionToken } from "./auth/sessions.service";
import { INSTITUTIONAL_ROLES, Role } from "./roles/role.entity";
import { Resource } from "./roles/resource.entity";
import { RoleResource } from "./roles/role-resource.entity";
import { RolesService } from "./roles/roles.service";
import { type AccountStatus, User } from "./users/user.entity";
import { UsersService, normalizeEmail } from "./users/users.service";

let dataSource: DataSource;
let sessions: SessionsService;
let users: UsersService;
let roles: RolesService;

async function createUser(email: string, accountStatus: AccountStatus = "active") {
  return dataSource.getRepository(User).save(
    dataSource.getRepository(User).create({
      fullName: "Persona Ficticia",
      emailNormalized: normalizeEmail(email),
      passwordHash: "hash-ficticio-no-argon2",
      accountStatus,
      emailVerifiedAt: new Date(),
    }),
  );
}

before(async () => {
  dataSource = await createTestDataSource();
  await seedRoles(dataSource);
  sessions = new SessionsService(dataSource.getRepository(Session));
  users = new UsersService(dataSource.getRepository(User));
  roles = new RolesService(
    dataSource.getRepository(Role),
    dataSource.getRepository(Resource),
    dataSource.getRepository(RoleResource),
    dataSource,
  );
});

after(async () => {
  await dataSource.destroy();
});

describe("migracion IdentityBase", () => {
  it("crea las tablas de identidad", async () => {
    const rows: { name: string }[] = await dataSource.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = rows.map((row) => row.name);

    for (const table of [
      "users",
      "roles",
      "user_roles",
      "sessions",
      "membership_requests",
      "invitations",
      "verification_tokens",
    ]) {
      assert.ok(names.includes(table), `falta la tabla ${table}`);
    }
  });

  it("rechaza estados de cuenta invalidos", async () => {
    await assert.rejects(
      dataSource.query(
        "INSERT INTO users (id, full_name, email_normalized, password_hash, account_status) VALUES ('x', 'X', 'x@example.test', 'h', 'superuser')",
      ),
    );
  });

  it("aplica claves foraneas", async () => {
    await assert.rejects(
      dataSource.query("INSERT INTO user_roles (user_id, role_id) VALUES ('no-existe', 'no-existe')"),
    );
  });
});

describe("migracion IdentityFlows", () => {
  it("permite una sola solicitud de vinculacion pendiente por usuario", async () => {
    const user = await createUser("solicitud@example.test", "pending");
    const insert = (id: string, status: string) =>
      dataSource.query("INSERT INTO membership_requests (id, user_id, status) VALUES (?, ?, ?)", [id, user.id, status]);

    await insert("mr-1", "rejected");
    await insert("mr-2", "pending");
    await assert.rejects(insert("mr-3", "pending"));
    await assert.rejects(insert("mr-4", "archivada"));
  });

  it("restringe el proposito de los tokens de verificacion", async () => {
    const user = await createUser("token@example.test");
    const insert = (id: string, purpose: string) =>
      dataSource.query(
        "INSERT INTO verification_tokens (id, user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, ?, datetime('now'))",
        [id, user.id, purpose, `hash-${id}`],
      );

    await insert("vt-1", "password_reset");
    await assert.rejects(insert("vt-2", "login_magico"));
  });

  it("exige un rol existente en las invitaciones", async () => {
    await assert.rejects(
      dataSource.query(
        "INSERT INTO invitations (id, email_normalized, role_id, token_hash, expires_at) VALUES ('inv-1', 'x@example.test', 'no-existe', 'h', datetime('now'))",
      ),
    );
  });
});

describe("seed de roles", () => {
  it("es idempotente", async () => {
    const second = await seedRoles(dataSource);
    const all = await roles.findAll();

    assert.deepEqual(second, { created: 0, updated: 0 });
    assert.equal(all.length, INSTITUTIONAL_ROLES.length);
    assert.deepEqual(
      all.map((role) => role.code),
      INSTITUTIONAL_ROLES.map((role) => role.code).sort(),
    );
  });
});

describe("UsersService", () => {
  it("normaliza el correo al consultar", async () => {
    const user = await createUser("  Ana.Prueba@Example.TEST ");
    const found = await users.findByEmail("ANA.PRUEBA@example.test");

    assert.equal(user.emailNormalized, "ana.prueba@example.test");
    assert.equal(found?.id, user.id);
  });

  it("impide correos duplicados", async () => {
    await createUser("duplicado@example.test");
    await assert.rejects(createUser(" DUPLICADO@example.test"));
  });

  it("no expone password_hash por defecto y carga roles", async () => {
    const user = await createUser("roles@example.test");
    const student = await roles.findByCode("student");
    await dataSource.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [user.id, student!.id]);

    const found = await users.findById(user.id);

    assert.equal(found?.passwordHash, undefined);
    assert.deepEqual(found?.roles.map((role) => role.code), ["student"]);
  });
});

describe("SessionsService", () => {
  it("guarda solo el hash SHA-256 del token", async () => {
    const user = await createUser("sesion@example.test");
    const { token, session } = await sessions.create(user.id);
    const stored: { token_hash: string }[] = await dataSource.query(
      "SELECT token_hash FROM sessions WHERE id = ?",
      [session.id],
    );

    assert.ok(token.length >= 43);
    assert.equal(stored[0].token_hash, hashSessionToken(token));
    assert.notEqual(stored[0].token_hash, token);
  });

  it("vence a los 7 dias", async () => {
    const user = await createUser("vencimiento@example.test");
    const now = new Date("2026-10-12T12:00:00Z");
    const { token, session } = await sessions.create(user.id, now);

    assert.equal(session.expiresAt.getTime() - now.getTime(), SESSION_TTL_MS);
    assert.ok(await sessions.findValid(token, new Date(now.getTime() + SESSION_TTL_MS - 1)));
    assert.equal(await sessions.findValid(token, new Date(now.getTime() + SESSION_TTL_MS)), null);
  });

  it("rechaza tokens desconocidos", async () => {
    assert.equal(await sessions.findValid("token-inventado"), null);
  });

  it("rechaza sesiones revocadas", async () => {
    const user = await createUser("logout@example.test");
    const { token } = await sessions.create(user.id);

    await sessions.revoke(token);

    assert.equal(await sessions.findValid(token), null);
  });

  it("revoca todas las sesiones de un usuario", async () => {
    const user = await createUser("todas@example.test");
    const first = await sessions.create(user.id);
    const second = await sessions.create(user.id);

    await sessions.revokeAllForUser(user.id);

    assert.equal(await sessions.findValid(first.token), null);
    assert.equal(await sessions.findValid(second.token), null);
  });

  it("liga un token CSRF a la sesion y lo compara por hash", async () => {
    const user = await createUser("csrf@example.test");
    const { csrfToken, session } = await sessions.create(user.id);
    const other = await sessions.create(user.id);

    assert.equal(session.csrfTokenHash, hashSessionToken(csrfToken));
    assert.equal(sessions.matchesCsrfToken(session, csrfToken), true);
    assert.equal(sessions.matchesCsrfToken(session, other.csrfToken), false);
    assert.equal(sessions.matchesCsrfToken(session, undefined), false);
    assert.equal(sessions.matchesCsrfToken(Object.assign(new Session(), session, { csrfTokenHash: null }), csrfToken), false);
  });

  it("borra solo las sesiones vencidas", async () => {
    const user = await createUser("limpieza@example.test");
    const past = new Date(Date.now() - 2 * SESSION_TTL_MS);
    const expired = await sessions.create(user.id, past);
    const current = await sessions.create(user.id);

    const deleted = await sessions.deleteExpired();
    const remaining = await dataSource.getRepository(Session).findBy({ userId: user.id });

    assert.ok(deleted >= 1);
    assert.deepEqual(remaining.map((session) => session.id), [current.session.id]);
    assert.notEqual(remaining[0].id, expired.session.id);
  });

  it("rechaza sesiones de usuarios sin correo verificado", async () => {
    const user = await createUser("sin-verificar@example.test");
    const { token } = await sessions.create(user.id);

    await dataSource.getRepository(User).update({ id: user.id }, { emailVerifiedAt: null });
    assert.equal(await sessions.findValid(token), null);
  });

  it("rechaza sesiones de usuarios que ya no estan activos", async () => {
    const user = await createUser("inactivo@example.test");
    const { token } = await sessions.create(user.id);

    assert.ok(await sessions.findValid(token));
    await dataSource.getRepository(User).update({ id: user.id }, { accountStatus: "inactive" });
    assert.equal(await sessions.findValid(token), null);
  });
});
