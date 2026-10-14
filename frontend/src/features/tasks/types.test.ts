import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  type TaskItem,
  computeProgress,
  describeProgress,
  filterTasks,
  groupByStatus,
  isOverdue,
  isTaskStatus,
  sortTasks,
  todayInBogota,
} from "./types";

function task(overrides: Partial<TaskItem>): TaskItem {
  return {
    id: "t",
    projectId: "p",
    sprintId: null,
    title: "Tarea",
    description: null,
    status: "todo",
    priority: "medium",
    dueDate: null,
    assignee: null,
    createdBy: null,
    createdAt: "2026-10-13T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
    permissions: { canEdit: false, canChangeStatus: false },
    ...overrides,
  };
}

describe("progreso (F2-12)", () => {
  it("sin tareas no muestra porcentaje", () => {
    assert.deepEqual(describeProgress({ total: 0, done: 0, byStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 } }), {
      label: "Sin tareas",
      percent: null,
    });
  });

  it("cuenta tareas hechas y no redondea hacia el 100 %", () => {
    const byStatus = { todo: 1, in_progress: 0, in_review: 0, done: 199 };
    assert.deepEqual(describeProgress({ total: 200, done: 199, byStatus }), { label: "199 de 200 tareas hechas", percent: 99 });
    assert.equal(describeProgress({ total: 1, done: 1, byStatus: { ...byStatus, todo: 0, done: 1 } }).label, "1 de 1 tarea hecha");
  });
});

describe("progreso calculado en el tablero", () => {
  it("cuenta por estado las tareas cargadas", () => {
    assert.deepEqual(computeProgress([{ status: "done" }, { status: "todo" }, { status: "done" }]), {
      total: 3,
      done: 2,
      byStatus: { todo: 1, in_progress: 0, in_review: 0, done: 2 },
    });
    assert.equal(computeProgress([]).total, 0);
  });
});

describe("tablero", () => {
  const mine = task({ id: "a", assignee: { userId: "yo", fullName: "Yo" }, status: "in_progress" });
  const other = task({ id: "b", assignee: { userId: "otra", fullName: "Otra" } });
  const free = task({ id: "c", status: "done" });

  it("filtra por responsable", () => {
    assert.deepEqual(filterTasks([mine, other, free], "mine", "yo").map((item) => item.id), ["a"]);
    assert.deepEqual(filterTasks([mine, other, free], "unassigned", "yo").map((item) => item.id), ["c"]);
    assert.equal(filterTasks([mine, other, free], "all", "yo").length, 3);
  });

  it("agrupa por estado en columnas fijas conservando el orden", () => {
    const columns = groupByStatus([other, mine, free, task({ id: "d" })]);
    assert.deepEqual(Object.keys(columns), ["todo", "in_progress", "in_review", "done"]);
    assert.deepEqual(columns.todo.map((item) => item.id), ["b", "d"]);
    assert.deepEqual(columns.in_review, []);
  });

  it("ordena por prioridad y luego por antiguedad, como el backend", () => {
    const tasks = [
      task({ id: "baja", priority: "low", createdAt: "2026-10-01T00:00:00.000Z" }),
      task({ id: "media-nueva", createdAt: "2026-10-03T00:00:00.000Z" }),
      task({ id: "alta", priority: "high", createdAt: "2026-10-05T00:00:00.000Z" }),
      task({ id: "media-vieja", createdAt: "2026-10-02T00:00:00.000Z" }),
    ];
    assert.deepEqual(sortTasks(tasks).map((item) => item.id), ["alta", "media-vieja", "media-nueva", "baja"]);
  });

  it("solo acepta estados conocidos, sin claves heredadas", () => {
    assert.equal(isTaskStatus("in_review"), true);
    assert.equal(isTaskStatus("blocked"), false);
    assert.equal(isTaskStatus("constructor"), false);
  });
});

describe("fechas limite", () => {
  it("una tarea abierta con fecha pasada esta vencida; una hecha no", () => {
    assert.equal(isOverdue({ dueDate: "2026-10-12", status: "todo" }, "2026-10-13"), true);
    assert.equal(isOverdue({ dueDate: "2026-10-13", status: "todo" }, "2026-10-13"), false);
    assert.equal(isOverdue({ dueDate: "2026-10-01", status: "done" }, "2026-10-13"), false);
    assert.equal(isOverdue({ dueDate: null, status: "todo" }, "2026-10-13"), false);
  });

  it("hoy se calcula en hora de Bogota (UTC-5)", () => {
    assert.equal(todayInBogota(new Date("2026-10-14T03:00:00.000Z")), "2026-10-13");
    assert.equal(todayInBogota(new Date("2026-10-14T06:00:00.000Z")), "2026-10-14");
  });
});
