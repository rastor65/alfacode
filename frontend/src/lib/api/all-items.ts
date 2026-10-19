import { apiRequest } from "./client";

/** Recorre paginas de opciones sin truncar silenciosamente a los primeros cien registros. */
export async function allItems<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const data = await apiRequest<{ items: T[]; total: number }>(`${path}${path.includes("?") ? "&" : "?"}pageSize=100&page=${page}`);
    items.push(...data.items);
    if (!data.items.length || items.length >= data.total) return items;
  }
}
