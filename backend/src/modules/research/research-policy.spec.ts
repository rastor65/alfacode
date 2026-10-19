import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canManageProjectResearch, canManageResearchLines, normalizeLineName } from "./research-policy";

describe("politica de investigacion (F3-01 a F3-04)", () => {
  it("solo admin y coordinator gestionan las lineas", () => {
    assert.equal(canManageResearchLines(["admin"]), true);
    assert.equal(canManageResearchLines(["coordinator"]), true);
    assert.equal(canManageResearchLines(["teacher_leader", "researcher", "student"]), false);
    assert.equal(canManageResearchLines([]), false);
  });

  it("la informacion investigativa del proyecto la gestionan autoridad y lider", () => {
    assert.equal(canManageProjectResearch("authority"), true);
    assert.equal(canManageProjectResearch("leader"), true);
    assert.equal(canManageProjectResearch("collaborator"), false);
    assert.equal(canManageProjectResearch("none"), false);
  });

  it("normaliza nombres para detectar duplicados con tildes, mayusculas o espacios", () => {
    assert.equal(normalizeLineName("  Ingeniería   de   Software "), "ingenieria de software");
    assert.equal(normalizeLineName("INGENIERIA DE SOFTWARE"), normalizeLineName("ingeniería de software"));
    assert.notEqual(normalizeLineName("Robótica"), normalizeLineName("Robótica educativa"));
  });
});
