import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assignableRoles, isAuthority } from "@/lib/auth/roles";

import { initialsOf, parsePage, parseRequestStatus, requestStats } from "./types";

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

describe("resumen de solicitudes", () => {
  const person = (emailVerified: boolean) => ({ id: "u", fullName: "Ana", email: "a@x.co", emailVerified });

  it("cuenta Hojas de Vida y correos verificados y halla la mas antigua y la ultima revision", () => {
    const stats = requestStats([
      { cvData: { programa: "Ingenieria" }, user: person(true), createdAt: "2026-10-02T10:00:00Z", reviewedAt: null, reviewedBy: null },
      { cvData: null, user: person(false), createdAt: "2026-10-01T10:00:00Z", reviewedAt: "2026-10-05T10:00:00Z", reviewedBy: { id: "r1", fullName: "Rev Uno" } },
      { user: person(true), createdAt: "2026-10-03T10:00:00Z", reviewedAt: "2026-10-04T10:00:00Z", reviewedBy: { id: "r2", fullName: "Rev Dos" } },
    ]);

    assert.equal(stats.withCv, 1);
    assert.equal(stats.verified, 2);
    assert.equal(stats.oldest, "2026-10-01T10:00:00Z");
    assert.deepEqual(stats.latestReview, { at: "2026-10-05T10:00:00Z", by: "Rev Uno" });
  });

  it("sin solicitudes no hay fechas", () => {
    assert.deepEqual(requestStats([]), { withCv: 0, verified: 0, oldest: null, latestReview: null });
  });

  it("calcula las iniciales con hasta dos palabras", () => {
    assert.equal(initialsOf("mateo epieyú uriana"), "ME");
    assert.equal(initialsOf("  Ana "), "A");
    assert.equal(initialsOf(""), "");
  });
});
