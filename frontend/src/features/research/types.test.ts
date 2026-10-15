import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isProfileEmpty, linkableLines, parseLineStatus, participantOptions, type ResearchProfile } from "./types";

const EMPTY: ResearchProfile = {
  problem: null,
  question: null,
  justification: null,
  methodology: null,
  notes: null,
  updatedAt: "2026-10-15T00:00:00.000Z",
  updatedBy: null,
};

describe("parseLineStatus", () => {
  it("acepta solo los estados conocidos", () => {
    assert.equal(parseLineStatus("active"), "active");
    assert.equal(parseLineStatus(["inactive", "active"]), "inactive");
    assert.equal(parseLineStatus("all"), undefined);
    assert.equal(parseLineStatus("constructor"), undefined);
    assert.equal(parseLineStatus(undefined), undefined);
  });
});

describe("isProfileEmpty", () => {
  it("considera vacia una ficha inexistente o sin texto", () => {
    assert.equal(isProfileEmpty(null), true);
    assert.equal(isProfileEmpty(EMPTY), true);
    assert.equal(isProfileEmpty({ ...EMPTY, notes: "Algo" }), false);
  });
});

describe("linkableLines", () => {
  it("ofrece solo lineas activas que el proyecto aun no tiene", () => {
    const lines = [
      { id: "a", status: "active" as const },
      { id: "b", status: "inactive" as const },
      { id: "c", status: "active" as const },
    ];
    assert.deepEqual(
      linkableLines(lines, ["c"]).map((line) => line.id),
      ["a"],
    );
  });
});

describe("participantOptions", () => {
  it("une el equipo con los participantes actuales sin repetir y en orden", () => {
    const team = [
      { userId: "2", fullName: "Zoe" },
      { userId: "1", fullName: "Ana" },
    ];
    const current = [
      { userId: "1", fullName: "Ana" },
      { userId: "3", fullName: "Ángela, ya fuera del equipo" },
    ];
    assert.deepEqual(
      participantOptions(team, current).map((person) => person.userId),
      ["1", "3", "2"],
    );
  });
});
