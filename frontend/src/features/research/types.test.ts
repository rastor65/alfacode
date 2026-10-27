import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterResults,
  isProfileEmpty,
  linkableLines,
  parseLineStatus,
  participantOptions,
  profileProgress,
  resultDay,
  resultTypeCounts,
  type ResearchProfile,
  type ResearchResult,
} from "./types";

const EMPTY: ResearchProfile = {
  problem: null,
  question: null,
  justification: null,
  methodology: null,
  notes: null,
  updatedAt: "2026-10-15T00:00:00.000Z",
  updatedBy: null,
};

describe("parseLineStatus", () => {
  it("acepta solo los estados conocidos", () => {
    assert.equal(parseLineStatus("active"), "active");
    assert.equal(parseLineStatus(["inactive", "active"]), "inactive");
    assert.equal(parseLineStatus("all"), undefined);
    assert.equal(parseLineStatus("constructor"), undefined);
    assert.equal(parseLineStatus(undefined), undefined);
  });
});

describe("isProfileEmpty", () => {
  it("considera vacia una ficha inexistente o sin texto", () => {
    assert.equal(isProfileEmpty(null), true);
    assert.equal(isProfileEmpty(EMPTY), true);
    assert.equal(isProfileEmpty({ ...EMPTY, notes: "Algo" }), false);
  });
});

describe("linkableLines", () => {
  it("ofrece solo lineas activas que el proyecto aun no tiene", () => {
    const lines = [
      { id: "a", status: "active" as const },
      { id: "b", status: "inactive" as const },
      { id: "c", status: "active" as const },
    ];
    assert.deepEqual(
      linkableLines(lines, ["c"]).map((line) => line.id),
      ["a"],
    );
  });
});

describe("participantOptions", () => {
  it("une el equipo con los participantes actuales sin repetir y en orden", () => {
    const team = [
      { userId: "2", fullName: "Zoe" },
      { userId: "1", fullName: "Ana" },
    ];
    const current = [
      { userId: "1", fullName: "Ana" },
      { userId: "3", fullName: "Ángela, ya fuera del equipo" },
    ];
    assert.deepEqual(
      participantOptions(team, current).map((person) => person.userId),
      ["1", "3", "2"],
    );
  });
});

describe("vista de investigacion del proyecto", () => {
  const result = (id: string, type: ResearchResult["type"], title: string, resultDate: string | null, extra: Partial<ResearchResult> = {}): ResearchResult => ({
    id,
    projectId: "p1",
    title,
    description: null,
    type,
    resultDate,
    references: null,
    participants: [],
    createdBy: null,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    permissions: { canEdit: false, canDelete: false },
    ...extra,
  });
  const results = [
    result("a", "finding", "Alófonos glotales", "2026-10-02", { participants: [{ userId: "u1", fullName: "Ángela Pérez" }] }),
    result("b", "prototype", "Prototipo de tutor", "2026-10-15", { description: "Modelo ajustado" }),
    result("c", "finding", "Corpus oral", null),
  ];

  it("cuenta los campos de la ficha con texto", () => {
    assert.deepEqual(profileProgress(null), { filled: 0, total: 5 });
    assert.deepEqual(profileProgress({ ...EMPTY, question: "¿Cómo?", notes: "Ética" }), { filled: 2, total: 5 });
  });

  it("cuenta resultados por tipo, incluidos los tipos sin resultados", () => {
    assert.deepEqual(resultTypeCounts(results), { finding: 2, prototype: 1, methodological: 0, other: 0 });
  });

  it("sin fecha propia, el resultado toma el dia en que se registro", () => {
    assert.equal(resultDay(results[0]), "2026-10-02");
    assert.equal(resultDay(results[2]), "2026-10-20");
  });

  it("ordena por fecha o por titulo", () => {
    const ids = (sort: "recent" | "oldest" | "title") => filterResults(results, { type: "all", text: "", sort }).map((item) => item.id);
    assert.deepEqual(ids("recent"), ["c", "b", "a"]);
    assert.deepEqual(ids("oldest"), ["a", "b", "c"]);
    assert.deepEqual(ids("title"), ["a", "c", "b"]);
  });

  it("filtra por tipo y por texto sin importar tildes ni mayusculas", () => {
    assert.deepEqual(filterResults(results, { type: "finding", text: "", sort: "title" }).map((item) => item.id), ["a", "c"]);
    assert.deepEqual(filterResults(results, { type: "all", text: "ALOFONOS", sort: "title" }).map((item) => item.id), ["a"]);
    assert.deepEqual(filterResults(results, { type: "all", text: "angela", sort: "title" }).map((item) => item.id), ["a"]);
    assert.deepEqual(filterResults(results, { type: "all", text: "ajustado", sort: "title" }).map((item) => item.id), ["b"]);
    assert.deepEqual(filterResults(results, { type: "prototype", text: "corpus", sort: "title" }), []);
  });

  it("filtrar no altera la lista original", () => {
    const before = results.map((item) => item.id);
    filterResults(results, { type: "all", text: "", sort: "oldest" });
    assert.deepEqual(results.map((item) => item.id), before);
  });
});
