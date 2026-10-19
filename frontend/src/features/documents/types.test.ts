import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { acceptAttribute, accessHint, checkFile, formatBytes, parseCategory, parseScope } from "./types";

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
