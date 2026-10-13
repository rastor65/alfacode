import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assignableRoles, isAuthority } from "@/lib/auth/roles";

import { parsePage, parseRequestStatus } from "./types";

describe("roles en la interfaz", () => {
  it("solo admin y coordinator son autoridades", () => {
    assert.equal(isAuthority(["admin"]), true);
    assert.equal(isAuthority(["student", "coordinator"]), true);
    assert.equal(isAuthority(["teacher_leader", "researcher"]), false);
  });

  it("ofrece al coordinator solo los roles que el backend le permite asignar", () => {
    assert.deepEqual(assignableRoles(["admin"]), ["student", "researcher", "teacher_leader", "coordinator", "admin"]);
    assert.deepEqual(assignableRoles(["coordinator"]), ["student", "researcher", "teacher_leader"]);
    assert.deepEqual(assignableRoles(["student"]), []);
  });
});

describe("filtros de la URL", () => {
  it("lee el estado y usa pendientes ante cualquier otro valor", () => {
    assert.equal(parseRequestStatus("approved"), "approved");
    assert.equal(parseRequestStatus(["rejected", "approved"]), "rejected");
    for (const value of [undefined, "", "todas", "PENDING"]) {
      assert.equal(parseRequestStatus(value), "pending", String(value));
    }
  });

  it("acepta solo paginas enteras positivas", () => {
    assert.equal(parsePage("3"), 3);
    for (const value of [undefined, "0", "-2", "1.5", "abc", "99999"]) {
      assert.equal(parsePage(value), 1, String(value));
    }
  });
});
