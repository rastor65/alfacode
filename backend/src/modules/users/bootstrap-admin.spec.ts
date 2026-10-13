import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { DataSource } from "typeorm";

import { seedRoles } from "../../database/seeds/roles.seed";
import { createTestDataSource } from "../../database/test-data-source";
import { AuditEvent } from "../audit/audit-event.entity";
import { PasswordService } from "../auth/password.service";
import { canAssignRole } from "../roles/role-policy";
import { BootstrapAdminError, bootstrapAdmin } from "./bootstrap-admin";
import { User } from "./user.entity";

const INPUT = { fullName: "Admin Ficticio", email: " Admin@Uniguajira.EDU.CO ", password: "Clave-Admin-Ficticia-1" };

let dataSource: DataSource;
const passwords = new PasswordService();

beforeEach(async () => {
  dataSource = await createTestDataSource();
});

afterEach(async () => {
  await dataSource.destroy();
});

describe("bootstrapAdmin", () => {
  it("crea un administrador activo y verificado, y lo audita", async () => {
    await seedRoles(dataSource);

    const result = await bootstrapAdmin(dataSource, passwords, INPUT);
    const user = await dataSource.getRepository(User).findOneOrFail({
      where: { id: result.id },
      relations: { roles: true },
    });
    const audit = await dataSource.getRepository(AuditEvent).findOneByOrFail({ action: "admin.bootstrapped" });

    assert.equal(user.emailNormalized, "admin@uniguajira.edu.co");
    assert.equal(user.accountStatus, "active");
    assert.notEqual(user.emailVerifiedAt, null);
    assert.deepEqual(user.roles.map((role) => role.code), ["admin"]);
    assert.equal(audit.targetId, user.id);
    assert.doesNotMatch(audit.details ?? "", /Clave-Admin/);
  });

  it("falla si ya existe un administrador y no lo reemplaza", async () => {
    await seedRoles(dataSource);
    await bootstrapAdmin(dataSource, passwords, INPUT);

    await assert.rejects(
      bootstrapAdmin(dataSource, passwords, { ...INPUT, email: "otro-admin@uniguajira.edu.co" }),
      (error: unknown) => error instanceof BootstrapAdminError && /ya existe un administrador/i.test(error.message),
    );
    assert.equal(await dataSource.getRepository(User).count(), 1);
  });

  it("rechaza contrasenas cortas, correos invalidos y la falta de roles", async () => {
    await assert.rejects(bootstrapAdmin(dataSource, passwords, INPUT), /seed:roles/);

    await seedRoles(dataSource);
    await assert.rejects(bootstrapAdmin(dataSource, passwords, { ...INPUT, password: "corta" }), /password/);
    await assert.rejects(bootstrapAdmin(dataSource, passwords, { ...INPUT, email: "no-es-correo" }), /email/);
  });
});

describe("bootstrapAdmin y el dominio institucional", () => {
  it("rechaza correos fuera de @uniguajira.edu.co", async () => {
    await seedRoles(dataSource);

    await assert.rejects(
      bootstrapAdmin(dataSource, passwords, { ...INPUT, email: "admin@gmail.com" }),
      (error: unknown) => error instanceof BootstrapAdminError && /@uniguajira\.edu\.co/.test(error.message),
    );
    assert.equal(await dataSource.getRepository(User).count(), 0);
  });
});

describe("canAssignRole", () => {
  it("aplica la matriz de permisos F1", () => {
    assert.equal(canAssignRole(["admin"], "admin"), true);
    assert.equal(canAssignRole(["coordinator"], "student"), true);
    assert.equal(canAssignRole(["coordinator"], "teacher_leader"), true);
    assert.equal(canAssignRole(["coordinator"], "admin"), false);
    assert.equal(canAssignRole(["coordinator"], "coordinator"), false);
    assert.equal(canAssignRole(["teacher_leader", "researcher"], "student"), false);
    assert.equal(canAssignRole(["student", "coordinator"], "researcher"), true);
  });
});
