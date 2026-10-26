import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { activeSprint, defaultScope, deliveredRate, parseScope, scopeValue, sprintTiming, tasksInScope } from "./types";

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

describe("plazo y entrega de sprints", () => {
  const sprint = { startDate: "2026-10-01", endDate: "2026-10-14" };

  it("cuenta dias inclusivos y los que faltan", () => {
    assert.deepEqual(sprintTiming(sprint, "2026-10-01"), { total: 14, elapsed: 1, remaining: 13 });
    assert.deepEqual(sprintTiming(sprint, "2026-10-14"), { total: 14, elapsed: 14, remaining: 0 });
  });

  it("antes del inicio no hay dias transcurridos y vencido da negativo", () => {
    assert.equal(sprintTiming(sprint, "2026-09-20").elapsed, 0);
    assert.deepEqual(sprintTiming(sprint, "2026-10-17"), { total: 14, elapsed: 14, remaining: -3 });
  });

  it("la entrega solo cuenta sprints completados y no inventa porcentaje", () => {
    const progress = (done: number, total: number) => ({ done, total, byStatus: { todo: 0, in_progress: 0, in_review: 0, done } });
    assert.deepEqual(deliveredRate([{ status: "active", progress: progress(1, 4) }]), { closed: 0, percent: null });
    assert.deepEqual(deliveredRate([{ status: "completed", progress: progress(0, 0) }]), { closed: 1, percent: null });
    assert.deepEqual(
      deliveredRate([
        { status: "completed", progress: progress(7, 8) },
        { status: "completed", progress: progress(2, 4) },
        { status: "cancelled", progress: progress(0, 5) },
      ]),
      { closed: 2, percent: 75 },
    );
  });
});
