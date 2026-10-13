import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCalendarDate, parseMethodology, parseProjectStatus } from "./types";

describe("parseProjectStatus", () => {
  it("acepta los estados conocidos y toma el primero si se repite", () => {
    assert.equal(parseProjectStatus("active"), "active");
    assert.equal(parseProjectStatus(["paused", "active"]), "paused");
  });

  it("descarta valores desconocidos, 'all' y claves heredadas", () => {
    assert.equal(parseProjectStatus(undefined), undefined);
    assert.equal(parseProjectStatus(""), undefined);
    assert.equal(parseProjectStatus("all"), undefined);
    assert.equal(parseProjectStatus("ACTIVE"), undefined);
    assert.equal(parseProjectStatus("constructor"), undefined);
    assert.equal(parseProjectStatus("toString"), undefined);
  });
});

describe("parseMethodology", () => {
  it("solo acepta tradicional o agil", () => {
    assert.equal(parseMethodology("traditional"), "traditional");
    assert.equal(parseMethodology(["agile"]), "agile");
    assert.equal(parseMethodology("all"), undefined);
    assert.equal(parseMethodology("scrum"), undefined);
    assert.equal(parseMethodology(undefined), undefined);
  });
});

describe("formatCalendarDate", () => {
  it("formatea la fecha de calendario sin desplazarla por zona horaria", () => {
    const formatted = formatCalendarDate("2026-01-01");
    assert.ok(formatted?.includes("2026"));
    assert.ok(formatted?.startsWith("1 "), `se esperaba el dia 1, se obtuvo ${formatted}`);
  });

  it("devuelve null sin fecha", () => {
    assert.equal(formatCalendarDate(null), null);
  });
});
