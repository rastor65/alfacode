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
  DEFAULT_TASK_QUERY,
  parseTasksView,
  queryTasks,
  quickCounts,
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

describe("busqueda y filtros combinados del tablero", () => {
  const ana = { userId: "u1", fullName: "Ana Pérez" };
  const luis = { userId: "u2", fullName: "Luis Gómez" };
  const tasks = [
    task({ id: "a", title: "Diseñar API", priority: "low", dueDate: "2026-10-10", assignee: ana, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-05T00:00:00.000Z" }),
    task({ id: "b", title: "Revisar corpus de audio", priority: "high", dueDate: "2026-11-01", assignee: luis, createdAt: "2026-10-02T00:00:00.000Z", updatedAt: "2026-10-09T00:00:00.000Z" }),
    task({ id: "c", title: "Escribir informe", priority: "medium", dueDate: null, assignee: null, description: "Incluye gráficas", createdAt: "2026-10-03T00:00:00.000Z", updatedAt: "2026-10-07T00:00:00.000Z" }),
    task({ id: "d", title: "Tarea hecha vieja", status: "done", priority: "high", dueDate: "2026-09-01", assignee: ana, createdAt: "2026-10-04T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" }),
  ];
  const ids = (list: TaskItem[]) => list.map((item) => item.id);
  const today = "2026-10-20";

  it("sin filtros devuelve todas por prioridad (orden del backend)", () => {
    assert.deepEqual(ids(queryTasks(tasks, DEFAULT_TASK_QUERY, today)), ["b", "d", "c", "a"]);
  });
  it("busca sin distinguir mayusculas ni acentos, en titulo, descripcion y responsable", () => {
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, text: "disenar" }, today)), ["a"]);
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, text: "GRAFICAS" }, today)), ["c"]);
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, text: "gomez" }, today)), ["b"]);
    assert.deepEqual(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, text: "zzz" }, today), []);
  });
  it("responsable: una persona, sin responsable o todos", () => {
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, assignee: "u1" }, today)), ["d", "a"]);
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, assignee: "none" }, today)), ["c"]);
  });
  it("vencidas excluye las hechas y las que no tienen fecha", () => {
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, overdue: true }, today)), ["a"]);
  });
  it("orden por fecha limite (sin fecha al final) y por actividad reciente", () => {
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, sort: "due" }, today)), ["d", "a", "b", "c"]);
    assert.deepEqual(ids(queryTasks(tasks, { ...DEFAULT_TASK_QUERY, sort: "recent" }, today)), ["b", "c", "a", "d"]);
  });
  it("no modifica la lista original", () => {
    const before = ids(tasks);
    queryTasks(tasks, { ...DEFAULT_TASK_QUERY, sort: "recent" }, today);
    assert.deepEqual(ids(tasks), before);
  });
  it("atajos: cuentan solo tareas abiertas", () => {
    assert.deepEqual(quickCounts(tasks, "u1", today), { mine: 1, unassigned: 1, overdue: 1 });
  });
  it("vista: lista solo si esta guardada", () => {
    assert.equal(parseTasksView("list"), "list");
    for (const other of [undefined, "", "board", "table", "LIST"]) assert.equal(parseTasksView(other), "board");
  });
});
