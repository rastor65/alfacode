export const PRODUCT_TYPES = { article: "Artículo", presentation: "Ponencia", poster: "Póster", book_chapter: "Capítulo de libro", book: "Libro", software: "Software", other: "Otro" };
export const PRODUCT_STATUSES = { in_progress: "En elaboración", submitted: "Enviado", accepted: "Aceptado", published: "Publicado / presentado", rejected: "Rechazado" };
export type AcademicKind = "academic-products" | "recognitions";
export type AcademicItem = {
  id: string; title: string; description: string | null; projectId: string | null;
  project: { id: string; name: string } | null; permissions: { canManage: boolean };
  type?: keyof typeof PRODUCT_TYPES; status?: keyof typeof PRODUCT_STATUSES;
  productDate?: string | null; source?: string | null; doi?: string | null; url?: string | null;
  authors?: { userId: string | null; externalName: string | null; fullName: string; position: number }[];
  results?: { id: string; title: string }[];
  recognitionDate?: string; userId?: string | null; user?: { id: string; fullName: string } | null;
  evidenceDocumentId?: string | null; evidence?: { id: string; title: string } | null;
};
export type AcademicPage = { items: AcademicItem[]; total: number; page: number; pageSize: number; permissions: { canCreateInstitutional: boolean } };
export function knownOption<T extends Record<string, string>>(options: T, value: string | string[] | undefined): keyof T | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && Object.hasOwn(options, first) ? first : undefined;
}
export function safeExternalUrl(value: string | null | undefined) {
  try { const url = new URL(value ?? ""); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}

export type ProductType = keyof typeof PRODUCT_TYPES;
export type ProductStatus = keyof typeof PRODUCT_STATUSES;
export const PRODUCT_STATUS_KEYS = Object.keys(PRODUCT_STATUSES) as ProductStatus[];
export const PRODUCT_TYPE_KEYS = Object.keys(PRODUCT_TYPES) as ProductType[];

/** Maximo de registros que lee la vista para los indicadores (el limite de pagina del backend). */
export const STATS_SAMPLE = 100;

/** Cifras de los productos cargados: conteo por estado y por tipo, y la ultima publicacion con fecha. */
export function productStats(items: readonly Pick<AcademicItem, "type" | "status" | "title" | "productDate" | "source">[]) {
  const byStatus = Object.fromEntries(PRODUCT_STATUS_KEYS.map((key) => [key, 0])) as Record<ProductStatus, number>;
  const byType = Object.fromEntries(PRODUCT_TYPE_KEYS.map((key) => [key, 0])) as Record<ProductType, number>;
  let latestPublished: (typeof items)[number] | null = null;

  for (const item of items) {
    if (item.status) byStatus[item.status] += 1;
    if (item.type) byType[item.type] += 1;
    if (item.status === "published" && item.productDate && (!latestPublished?.productDate || item.productDate > latestPublished.productDate)) {
      latestPublished = item;
    }
  }

  return { byStatus, byType, latestPublished };
}
