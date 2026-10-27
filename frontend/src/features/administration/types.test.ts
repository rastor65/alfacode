import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { knownKey, REQUEST_TYPES, requestTotals } from "./types";

describe("requestTotals", () => {
  it("cuenta por estado y solo marca sin responsable las solicitudes abiertas", () => {
    const totals = requestTotals([
      { status: "pending", reviewerId: null },
      { status: "pending", reviewerId: "u1" },
      { status: "in_review", reviewerId: null },
      { status: "approved", reviewerId: null },
      { status: "rejected", reviewerId: "u1" },
      { status: "completed", reviewerId: "u1" },
    ]);

    assert.deepEqual(totals.byStatus, { pending: 2, in_review: 1, approved: 1, rejected: 1, completed: 1 });
    assert.equal(totals.unassigned, 2);
    assert.equal(totals.resolved, 3);
  });

  it("devuelve ceros sin solicitudes", () => {
    const totals = requestTotals([]);
    assert.equal(totals.unassigned, 0);
    assert.equal(totals.resolved, 0);
  });
});

describe("knownKey", () => {
  it("acepta solo claves conocidas, incluso con valores repetidos", () => {
    assert.equal(knownKey(REQUEST_TYPES, "certificate"), "certificate");
    assert.equal(knownKey(REQUEST_TYPES, ["general", "certificate"]), "general");
    assert.equal(knownKey(REQUEST_TYPES, "constructor"), undefined);
    assert.equal(knownKey(REQUEST_TYPES, "all"), undefined);
    assert.equal(knownKey(REQUEST_TYPES, undefined), undefined);
  });
});
