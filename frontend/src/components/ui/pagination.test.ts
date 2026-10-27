import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pageNumbers } from "./pagination";

describe("pageNumbers", () => {
  it("muestra todas las paginas cuando son pocas", () => {
    assert.deepEqual(pageNumbers(1, 1), [1]);
    assert.deepEqual(pageNumbers(2, 4), [1, 2, 3, 4]);
  });

  it("resume con saltos y no oculta una sola pagina", () => {
    assert.deepEqual(pageNumbers(1, 10), [1, 2, null, 10]);
    assert.deepEqual(pageNumbers(5, 10), [1, null, 4, 5, 6, null, 10]);
    assert.deepEqual(pageNumbers(3, 10), [1, 2, 3, 4, null, 10]);
    assert.deepEqual(pageNumbers(10, 10), [1, null, 9, 10]);
  });
});
