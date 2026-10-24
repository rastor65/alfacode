import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { addDays, overdueLabel, plural, progressLabel, relativeTime, splitDeadlines } from "./types";

describe("indicadores de seguimiento", () => {
  it("sin tareas no muestra porcentaje; con tareas muestra el calculado por el backend", () => {
    assert.equal(progressLabel({ progress: null }), "Sin tareas");
    assert.equal(progressLabel({ progress: 0 }), "0 %");
    assert.equal(progressLabel({ progress: 100 }), "100 %");
  });
  it("concuerda singular y plural", () => {
    assert.equal(plural(1, "vencida", "vencidas"), "1 vencida");
    assert.equal(plural(0, "vencida", "vencidas"), "0 vencidas");
  });
  it("ultima actividad relativa al corte; mas de 30 dias sin texto relativo", () => {
    const cutoff = "2026-10-24T15:00:00.000Z";
    assert.equal(relativeTime("2026-10-24T14:59:40.000Z", cutoff), "Hace un momento");
    assert.equal(relativeTime("2026-10-24T14:15:00.000Z", cutoff), "Hace 45 min");
    assert.equal(relativeTime("2026-10-24T11:00:00.000Z", cutoff), "Hace 4 h");
    assert.equal(relativeTime("2026-10-23T14:00:00.000Z", cutoff), "Hace 1 día");
    assert.equal(relativeTime("2026-10-10T15:00:00.000Z", cutoff), "Hace 14 días");
    assert.equal(relativeTime("2026-09-01T15:00:00.000Z", cutoff), null);
  });
  it("atraso de tareas vencidas en dias de calendario", () => {
    assert.equal(overdueLabel("2026-10-23", "2026-10-24"), "Ayer");
    assert.equal(overdueLabel("2026-10-21", "2026-10-24"), "Hace 3 días");
    assert.equal(overdueLabel("2026-12-30", "2027-01-02"), "Hace 3 días");
  });
  it("suma dias de calendario sin zona horaria, cruzando mes y año", () => {
    assert.equal(addDays("2026-10-23", 7), "2026-10-30");
    assert.equal(addDays("2026-12-28", 7), "2027-01-04");
  });
  it("separa vencidas y por vencer en 7 dias; sin fecha y mas adelante quedan fuera", () => {
    const task = (dueDate: string | null) => ({ dueDate });
    const items = [task("2026-10-20"), task("2026-10-23"), task("2026-10-30"), task("2026-10-31"), task(null)];
    const { overdue, dueSoon } = splitDeadlines(items, "2026-10-23", "2026-10-30");
    assert.deepEqual(overdue, [items[0]]);
    assert.deepEqual(dueSoon, [items[1], items[2]]);
  });
});
