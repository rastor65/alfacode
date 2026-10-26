import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { knownOption, PRODUCT_STATUSES, PRODUCT_TYPES, productStats, safeExternalUrl } from "./types";
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
describe("indicadores de produccion", () => {
  const item = (title: string, type: "article" | "software", status: "published" | "in_progress" | "rejected", productDate: string | null) => ({ title, type, status, productDate, source: null });

  it("cuenta por estado y por tipo, incluidos los que no tienen registros", () => {
    const stats = productStats([item("a", "article", "published", "2026-10-01"), item("b", "article", "in_progress", null), item("c", "software", "published", "2026-10-20")]);
    assert.equal(stats.byStatus.published, 2);
    assert.equal(stats.byStatus.in_progress, 1);
    assert.equal(stats.byStatus.accepted, 0);
    assert.equal(stats.byType.article, 2);
    assert.equal(stats.byType.book, 0);
  });

  it("la ultima publicacion es la publicada con fecha mas reciente", () => {
    assert.equal(productStats([item("a", "article", "published", "2026-10-01"), item("c", "software", "published", "2026-10-20")]).latestPublished?.title, "c");
    assert.equal(productStats([item("a", "article", "in_progress", "2026-12-01"), item("b", "article", "published", null)]).latestPublished, null);
    assert.equal(productStats([]).latestPublished, null);
  });
});
