import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { plural, progressLabel } from "./types";

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
});
