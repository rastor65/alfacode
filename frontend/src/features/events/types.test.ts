import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bogotaInput, eventStats, eventsOnDay, formatEventRange, localInputToUtc, monthDays, monthShift, overlapsDay, validMonth } from "./types";
describe("fechas y calendario de actividades", () => {
  it("convierte entradas de Bogota sin depender de la zona del equipo", () => {
    assert.equal(localInputToUtc("2026-10-18T09:30"), "2026-10-18T14:30:00.000Z");
    assert.equal(bogotaInput("2026-10-19T01:30:00Z"), "2026-10-18T20:30");
    assert.equal(localInputToUtc("2026-02-30T09:30"), null);
    assert.equal(localInputToUtc("2026-10-18T25:00"), null);
    assert.equal(localInputToUtc("2026-10-18"), null);
    assert.equal(bogotaInput("no es fecha"), "");
  });
  it("genera meses bisiestos y cruces de ano", () => {
    assert.equal(monthDays("2028-02").length, 29);
    assert.equal(monthDays("2026-02").length, 28);
    assert.equal(monthShift("2026-12", 1), "2027-01");
    assert.equal(monthShift("2026-01", -1), "2025-12");
    assert.equal(validMonth("2026-13"), undefined);
    assert.deepEqual(monthDays("invalido"), []);
  });
  it("incluye actividades que cruzan dias y excluye un fin exacto a medianoche", () => {
    const event = { startsAt: "2026-10-19T04:30:00.000Z", endsAt: "2026-10-19T06:00:00.000Z" };
    assert.equal(overlapsDay(event, "2026-10-18"), true);
    assert.equal(overlapsDay(event, "2026-10-19"), true);
    assert.equal(overlapsDay(event, "2026-10-20"), false);
    assert.equal(overlapsDay({ ...event, endsAt: "2026-10-19T05:00:00.000Z" }, "2026-10-19"), false);
  });
});
describe("resumen de actividades", () => {
  it("muestra el rango en hora de Bogota, de un dia o de varios", () => {
    assert.match(formatEventRange("2026-10-26T14:00:00.000Z", "2026-10-26T15:30:00.000Z"), /^26 oct · 09:00–10:30$/);
    assert.match(formatEventRange("2026-03-05T14:00:00.000Z", "2026-03-07T22:00:00.000Z"), /^5 mar 09:00 – 7 mar 17:00$/);
    // 01:30 UTC del 19 es todavia el 18 en Bogota.
    assert.match(formatEventRange("2026-10-19T01:30:00.000Z", "2026-10-19T03:00:00.000Z"), /^18 oct · 20:30–22:00$/);
  });

  it("cuenta por estado e inscritos", () => {
    const stats = eventStats([
      { status: "scheduled", participantCount: 4 },
      { status: "scheduled", participantCount: 8 },
      { status: "cancelled", participantCount: 0 },
    ]);
    assert.deepEqual(stats, { byStatus: { scheduled: 2, in_progress: 0, completed: 0, cancelled: 1 }, enrolled: 12 });
    assert.deepEqual(eventStats([]).byStatus, { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0 });
  });

  it("agrupa por dia las actividades que cruzan dias", () => {
    const events = [
      { id: "a", startsAt: "2026-10-18T14:00:00.000Z", endsAt: "2026-10-18T15:00:00.000Z" },
      { id: "b", startsAt: "2026-10-18T14:00:00.000Z", endsAt: "2026-10-20T15:00:00.000Z" },
    ];
    assert.deepEqual(eventsOnDay(events, "2026-10-18").map((event) => event.id), ["a", "b"]);
    assert.deepEqual(eventsOnDay(events, "2026-10-19").map((event) => event.id), ["b"]);
    assert.deepEqual(eventsOnDay(events, "2026-10-21"), []);
  });
});
