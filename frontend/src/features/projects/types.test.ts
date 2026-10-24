import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { daysSpan, formatCalendarDate, parseAlerts, parseMethodology, parseProjectStatus, parseSort, parseView, projectsHref, type ListFilters } from "./types";

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

describe("parametros de la lista de proyectos", () => {
  const base: ListFilters = { q: "", alerts: false, sort: "activity", page: 1 };
  it("orden: valores conocidos o actividad por defecto, sin claves heredadas", () => {
    assert.equal(parseSort("name"), "name");
    assert.equal(parseSort(["end_date", "name"]), "end_date");
    for (const bad of [undefined, "", "popularidad", "constructor", "NAME"]) assert.equal(parseSort(bad), "activity");
  });
  it("alertas solo con 1", () => {
    assert.equal(parseAlerts("1"), true);
    for (const other of [undefined, "", "0", "true", "si"]) assert.equal(parseAlerts(other), false);
  });
  it("vista: tabla solo si esta guardada; cualquier otro valor, tarjetas", () => {
    assert.equal(parseView("table"), "table");
    for (const other of [undefined, "", "cards", "grid", "TABLE"]) assert.equal(parseView(other), "cards");
  });
  it("la direccion omite los valores por defecto y vuelve a la pagina 1 al cambiar un filtro", () => {
    assert.equal(projectsHref(base), "/hub/proyectos");
    const current: ListFilters = { q: "wayuu & co", status: "active", alerts: true, sort: "name", page: 3 };
    assert.equal(projectsHref(current, { page: 4 }), "/hub/proyectos?q=wayuu+%26+co&estado=active&alertas=1&orden=name&pagina=4");
    assert.equal(projectsHref(current, { status: undefined }), "/hub/proyectos?q=wayuu+%26+co&alertas=1&orden=name");
    assert.equal(projectsHref(current, { alerts: false, sort: "activity", q: "" }), "/hub/proyectos?estado=active");
  });
});

describe("daysSpan", () => {
  it("dias transcurridos acotados al periodo", () => {
    assert.deepEqual(daysSpan("2026-01-01", "2026-04-11", "2026-03-02"), { elapsed: 60, total: 100 });
    assert.deepEqual(daysSpan("2026-01-01", "2026-04-11", "2025-12-01"), { elapsed: 0, total: 100 });
    assert.deepEqual(daysSpan("2026-01-01", "2026-04-11", "2027-01-01"), { elapsed: 100, total: 100 });
  });
  it("sin fechas o con fin no posterior al inicio no hay periodo", () => {
    assert.equal(daysSpan(null, "2026-04-11", "2026-03-02"), null);
    assert.equal(daysSpan("2026-01-01", null, "2026-03-02"), null);
    assert.equal(daysSpan("2026-04-11", "2026-04-11", "2026-04-11"), null);
  });
});
