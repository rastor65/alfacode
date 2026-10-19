import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { activeSprint, defaultScope, parseScope, scopeValue, tasksInScope } from "./types";

const sprints = [
  { id: "s1", status: "completed" as const },
  { id: "s2", status: "active" as const },
  { id: "s3", status: "planned" as const },
];

describe("alcance del tablero agil", () => {
  it("por defecto muestra el sprint activo; sin activo, el backlog", () => {
    assert.equal(activeSprint(sprints)?.id, "s2");
    assert.deepEqual(defaultScope(sprints), { kind: "sprint", sprintId: "s2" });
    assert.deepEqual(defaultScope([{ id: "s1", status: "completed" }]), { kind: "backlog" });
    assert.deepEqual(defaultScope([]), { kind: "backlog" });
  });

  it("filtra tareas por backlog, sprint o todas", () => {
    const tasks = [
      { id: "a", sprintId: null },
      { id: "b", sprintId: "s2" },
      { id: "c", sprintId: "s1" },
    ];
    assert.deepEqual(tasksInScope(tasks, { kind: "backlog" }).map((task) => task.id), ["a"]);
    assert.deepEqual(tasksInScope(tasks, { kind: "sprint", sprintId: "s2" }).map((task) => task.id), ["b"]);
    assert.equal(tasksInScope(tasks, { kind: "all" }).length, 3);
  });

  it("convierte el valor del selector y rechaza sprints desconocidos", () => {
    assert.equal(scopeValue({ kind: "sprint", sprintId: "s3" }), "s3");
    assert.deepEqual(parseScope("backlog", sprints), { kind: "backlog" });
    assert.deepEqual(parseScope("s3", sprints), { kind: "sprint", sprintId: "s3" });
    assert.equal(parseScope("otro", sprints), null);
  });
});
