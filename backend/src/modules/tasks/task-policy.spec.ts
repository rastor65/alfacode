import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canChangeTaskStatus, canManageTasks } from "./task-policy";

describe("politica de tareas", () => {
  it("solo la autoridad y el lider gestionan tareas", () => {
    assert.equal(canManageTasks("authority"), true);
    assert.equal(canManageTasks("leader"), true);
    assert.equal(canManageTasks("collaborator"), false);
    assert.equal(canManageTasks("none"), false);
  });

  it("un colaborador cambia el estado solo de sus tareas asignadas", () => {
    assert.equal(canChangeTaskStatus("collaborator", "yo", "yo"), true);
    assert.equal(canChangeTaskStatus("collaborator", "otra", "yo"), false);
    assert.equal(canChangeTaskStatus("collaborator", null, "yo"), false);
    assert.equal(canChangeTaskStatus("leader", null, "yo"), true);
    assert.equal(canChangeTaskStatus("none", "yo", "yo"), false);
  });
});
