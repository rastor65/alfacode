import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roleToggles } from "./role-toggles";

const byRole = (toggles: ReturnType<typeof roleToggles>) => Object.fromEntries(toggles.map((toggle) => [toggle.role, toggle]));

describe("roleToggles", () => {
  it("muestra los cinco roles, marcados segun los que tiene la persona", () => {
    const toggles = roleToggles({ roles: ["student", "researcher"], accountStatus: "active" }, ["admin"]);

    assert.deepEqual(
      toggles.map((toggle) => toggle.role),
      ["admin", "coordinator", "teacher_leader", "researcher", "student"],
    );
    assert.deepEqual(
      toggles.filter((toggle) => toggle.checked).map((toggle) => toggle.role),
      ["researcher", "student"],
    );
    assert.ok(toggles.every((toggle) => !toggle.disabled));
  });

  it("el coordinator no puede tocar admin ni coordinator", () => {
    const toggles = byRole(roleToggles({ roles: ["student"], accountStatus: "inactive" }, ["coordinator"]));

    assert.equal(toggles.admin.disabled, true);
    assert.equal(toggles.coordinator.disabled, true);
    assert.equal(toggles.researcher.disabled, false);
    assert.match(toggles.admin.reason ?? "", /administrador/);
  });

  it("no permite quitar el ultimo rol de una cuenta activa", () => {
    const toggles = byRole(roleToggles({ roles: ["student"], accountStatus: "active" }, ["admin"]));

    assert.equal(toggles.student.disabled, true);
    assert.match(toggles.student.reason ?? "", /al menos un rol/);
    assert.equal(toggles.researcher.disabled, false);
  });

  it("muestra los roles bloqueados con un motivo comun (propia cuenta o sin permiso)", () => {
    const toggles = roleToggles({ roles: ["admin"], accountStatus: "active" }, ["admin"], "No puedes cambiar tus propios roles.");

    assert.equal(toggles.length, 5);
    assert.ok(toggles.every((toggle) => toggle.disabled && toggle.reason === "No puedes cambiar tus propios roles."));
    assert.equal(toggles.find((toggle) => toggle.role === "admin")?.checked, true);
  });

  it("en cuentas inactivas si se puede quitar el ultimo rol, y en pendientes o rechazadas nada se edita", () => {
    assert.equal(byRole(roleToggles({ roles: ["student"], accountStatus: "inactive" }, ["admin"])).student.disabled, false);

    for (const accountStatus of ["pending", "rejected"] as const) {
      assert.ok(roleToggles({ roles: [], accountStatus }, ["admin"]).every((toggle) => toggle.disabled));
    }
  });
});
