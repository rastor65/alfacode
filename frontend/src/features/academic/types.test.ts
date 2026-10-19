import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { knownOption, PRODUCT_STATUSES, PRODUCT_TYPES, safeExternalUrl } from "./types";
describe("filtros y enlaces de produccion", () => {
  it("rechaza claves heredadas y estados desconocidos de URL", () => {
    assert.equal(knownOption(PRODUCT_TYPES, "constructor"), undefined);
    assert.equal(knownOption(PRODUCT_STATUSES, "__proto__"), undefined);
    assert.equal(knownOption(PRODUCT_TYPES, ["book", "article"]), "book");
    assert.equal(knownOption(PRODUCT_STATUSES, "published"), "published");
  });
  it("solo genera enlaces externos http o https", () => {
    for (const unsafe of ["javascript:alert(1)", "data:text/html,ejemplo", "file:///archivo", "correo@example.org", null]) assert.equal(safeExternalUrl(unsafe), null);
    assert.equal(safeExternalUrl("https://example.org/producto"), "https://example.org/producto");
  });
});
