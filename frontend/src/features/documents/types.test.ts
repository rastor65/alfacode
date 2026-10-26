import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NO_DOCUMENT_FILTER,
  acceptAttribute,
  accessHint,
  checkFile,
  documentTotals,
  fileFamily,
  filterDocuments,
  formatBytes,
  isFiltering,
  parseCategory,
  parseScope,
  type DocumentItem,
} from "./types";

const LIMITS = { maxBytes: 20 * 1024 * 1024, extensions: ["pdf", "docx", "png", "jpg", "jpeg"] };

describe("checkFile", () => {
  it("acepta extensiones permitidas sin importar mayusculas y dentro del limite", () => {
    assert.equal(checkFile({ name: "Acta.PDF", size: 1000 }, LIMITS), null);
    assert.equal(checkFile({ name: "foto.jpeg", size: LIMITS.maxBytes }, LIMITS), null);
  });

  it("explica por que rechaza un archivo", () => {
    assert.match(checkFile({ name: "pagina.html", size: 10 }, LIMITS) ?? "", /Formato no permitido/);
    assert.match(checkFile({ name: "sin-extension", size: 10 }, LIMITS) ?? "", /Formato no permitido/);
    assert.match(checkFile({ name: "vacio.pdf", size: 0 }, LIMITS) ?? "", /vacío/);
    assert.equal(checkFile({ name: "grande.pdf", size: LIMITS.maxBytes + 1 }, LIMITS), "El archivo pesa 20 MB; el máximo es 20 MB.");
  });
});

describe("formatBytes y acceptAttribute", () => {
  it("muestra tamanos legibles", () => {
    assert.equal(formatBytes(512), "512 B");
    assert.equal(formatBytes(2048), "2 KB");
    assert.equal(formatBytes(1.5 * 1024 * 1024), "1.5 MB");
    assert.equal(formatBytes(20 * 1024 * 1024), "20 MB");
  });

  it("arma el atributo accept", () => {
    assert.equal(acceptAttribute(["pdf", "png"]), ".pdf,.png");
  });
});

describe("filtros y ayudas", () => {
  it("acepta solo categorias y ambitos conocidos", () => {
    assert.equal(parseCategory("minutes"), "minutes");
    assert.equal(parseCategory(["report", "x"]), "report");
    assert.equal(parseCategory("constructor"), undefined);
    assert.equal(parseScope("institutional"), "institutional");
    assert.equal(parseScope("all"), undefined);
  });

  it("explica quien ve cada nivel segun el ambito", () => {
    assert.match(accessHint("restricted", "project"), /equipo/);
    assert.match(accessHint("restricted", "institutional"), /coordinación/);
    assert.match(accessHint("private", "project"), /autorices/);
  });
});

describe("vista de documentos del proyecto", () => {
  const doc = (id: string, extra: Partial<DocumentItem>): DocumentItem => ({
    id,
    scope: "project",
    project: { id: "p1", name: "Proyecto" },
    researchResult: null,
    title: id,
    description: null,
    category: "report",
    accessLevel: "general",
    originalName: `${id}.pdf`,
    extension: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 1000,
    uploadedBy: null,
    createdAt: "2026-10-10T10:00:00.000Z",
    updatedAt: "2026-10-10T10:00:00.000Z",
    permissions: { canEdit: false, canDelete: false },
    ...extra,
  });
  const items = [
    doc("Informe de avance", { createdAt: "2026-10-01T10:00:00.000Z", sizeBytes: 2048, uploadedBy: { userId: "u1", fullName: "Ángela Pérez" } }),
    doc("Acta de consentimiento", { category: "minutes", accessLevel: "private", createdAt: "2026-10-20T10:00:00.000Z", sizeBytes: 500, researchResult: { id: "r1", title: "Hallazgo oclusivas" } }),
    doc("Evidencia de campo", { category: "evidence", accessLevel: "restricted", createdAt: "2026-10-15T10:00:00.000Z", sizeBytes: 9000, originalName: "campo.xlsx", extension: "xlsx" }),
  ];
  const ids = (filter: Partial<typeof NO_DOCUMENT_FILTER>) => filterDocuments(items, { ...NO_DOCUMENT_FILTER, ...filter }).map((item) => item.id);

  it("clasifica el archivo por su extension", () => {
    assert.equal(fileFamily("PDF"), "pdf");
    assert.equal(fileFamily("docx"), "word");
    assert.equal(fileFamily("xlsx"), "sheet");
    assert.equal(fileFamily("pptx"), "slides");
    assert.equal(fileFamily("jpeg"), "image");
    assert.equal(fileFamily("zip"), "other");
  });

  it("ordena por fecha, titulo o tamano", () => {
    assert.deepEqual(ids({ sort: "recent" }), ["Acta de consentimiento", "Evidencia de campo", "Informe de avance"]);
    assert.deepEqual(ids({ sort: "oldest" }), ["Informe de avance", "Evidencia de campo", "Acta de consentimiento"]);
    assert.deepEqual(ids({ sort: "title" }), ["Acta de consentimiento", "Evidencia de campo", "Informe de avance"]);
    assert.deepEqual(ids({ sort: "size" }), ["Evidencia de campo", "Informe de avance", "Acta de consentimiento"]);
  });

  it("filtra por tipo, acceso y vinculo", () => {
    assert.deepEqual(ids({ category: "minutes" }), ["Acta de consentimiento"]);
    assert.deepEqual(ids({ access: "restricted" }), ["Evidencia de campo"]);
    assert.deepEqual(ids({ linked: "linked" }), ["Acta de consentimiento"]);
    assert.deepEqual(ids({ linked: "unlinked", sort: "title" }), ["Evidencia de campo", "Informe de avance"]);
    assert.deepEqual(ids({ category: "report", access: "private" }), []);
  });

  it("busca en titulo, archivo, autor y resultado sin tildes ni mayusculas", () => {
    assert.deepEqual(ids({ text: "CONSENTIMIENTO" }), ["Acta de consentimiento"]);
    assert.deepEqual(ids({ text: "campo.xlsx" }), ["Evidencia de campo"]);
    assert.deepEqual(ids({ text: "angela" }), ["Informe de avance"]);
    assert.deepEqual(ids({ text: "oclusivas" }), ["Acta de consentimiento"]);
  });

  it("detecta filtros activos sin contar el orden", () => {
    assert.equal(isFiltering(NO_DOCUMENT_FILTER), false);
    assert.equal(isFiltering({ ...NO_DOCUMENT_FILTER, sort: "size" }), false);
    assert.equal(isFiltering({ ...NO_DOCUMENT_FILTER, text: " x " }), true);
    assert.equal(isFiltering({ ...NO_DOCUMENT_FILTER, access: "private" }), true);
  });

  it("totaliza espacio, tipos, accesos y ultimo documento", () => {
    const totals = documentTotals(items);
    assert.equal(totals.bytes, 2048 + 500 + 9000);
    assert.equal(totals.byCategory.minutes, 1);
    assert.equal(totals.byCategory.other, 0);
    assert.deepEqual(totals.byAccess, { general: 1, restricted: 1, private: 1 });
    assert.equal(totals.latest?.id, "Acta de consentimiento");
    assert.equal(documentTotals([]).latest, null);
  });

  it("filtrar no altera la lista original", () => {
    const before = items.map((item) => item.id);
    ids({ sort: "size" });
    assert.deepEqual(items.map((item) => item.id), before);
  });
});
