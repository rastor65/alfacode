import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bogotaInput, localInputToUtc, monthDays, monthShift, overlapsDay, validMonth } from "./types";
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
