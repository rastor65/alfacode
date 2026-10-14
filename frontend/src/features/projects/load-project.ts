import "server-only";

import { notFound } from "next/navigation";

import { ApiRequestError } from "@/lib/api/errors";
import { serverApi } from "@/lib/api/server";

/**
 * Lecturas de las vistas de un proyecto: 404 (proyecto inexistente o ajeno, que el backend no
 * distingue) y 400 (ID mal formado) muestran la pagina de no encontrado.
 */
export async function loadProjectData<T extends unknown[]>(paths: { [K in keyof T]: string }, currentPath: string): Promise<T> {
  try {
    return (await Promise.all(paths.map((path) => serverApi(path, currentPath)))) as T;
  } catch (caught) {
    if (caught instanceof ApiRequestError && (caught.status === 404 || caught.status === 400)) {
      notFound();
    }
    throw caught;
  }
}
