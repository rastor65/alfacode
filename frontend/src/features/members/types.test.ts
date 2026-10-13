import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canManageMember } from "@/lib/auth/roles";

import { parseAccountStatus, parseRole, parseSearch } from "./types";

describe("canManageMember", () => {
  const admin = { id: "a", roles: ["admin" as const] };
  const coordinator = { id: "c", roles: ["coordinator" as const] };

  it("nadie se administra a si mismo", () => {
    assert.equal(canManageMember(admin, admin), false);
  });

  it("el coordinator no administra admins ni coordinators", () => {
    assert.equal(canManageMember(coordinator, { id: "x", roles: ["student"] }), true);
    assert.equal(canManageMember(coordinator, { id: "x", roles: ["admin"] }), false);
    assert.equal(canManageMember(coordinator, { id: "x", roles: ["researcher", "coordinator"] }), false);
    assert.equal(canManageMember(admin, { id: "x", roles: ["coordinator"] }), true);
    assert.equal(canManageMember({ id: "s", roles: ["student"] }, { id: "x", roles: ["student"] }), false);
  });
});

describe("filtros de integrantes", () => {
  it("lee estado, rol y busqueda de la URL", () => {
    assert.equal(parseAccountStatus("rejected"), "rejected");
    assert.equal(parseAccountStatus("cualquiera"), "active");
    assert.equal(parseRole("teacher_leader"), "teacher_leader");
    assert.equal(parseRole("superusuario"), undefined);
    assert.equal(parseSearch("  ana  "), "ana");
    assert.equal(parseSearch("x".repeat(150)).length, 100);
  });
});
