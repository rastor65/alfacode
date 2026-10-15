import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";

import { ApiError } from "../../common/api-error";

export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");

/**
 * F3-06. Contrato del almacenamiento de documentos. Las claves las genera el backend (UUID
 * aleatorio); nunca derivan del nombre ni de datos del cliente.
 */
export interface StorageService {
  readonly driver: StorageDriver;
  put(key: string, content: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export type StorageDriver = "local" | "none";

export const STORAGE_NOT_CONFIGURED = () =>
  new ApiError(
    503,
    "STORAGE_NOT_CONFIGURED",
    "El almacenamiento de documentos no esta configurado en este entorno",
  );

const KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Adaptador de disco solo para desarrollo y pruebas (F3-06): en produccion no se usa el disco
 * del servidor, que puede ser efimero (DEC-029).
 */
export class LocalDiskStorage implements StorageService {
  readonly driver = "local" as const;
  private readonly root: string;

  constructor(directory: string) {
    this.root = resolve(directory);
  }

  async put(key: string, content: Buffer) {
    await mkdir(this.root, { recursive: true });
    // `wx`: nunca sobrescribe; 0o600: solo el proceso del backend lo lee.
    await writeFile(this.pathFor(key), content, { flag: "wx", mode: 0o600 });
  }

  async get(key: string) {
    return readFile(this.pathFor(key));
  }

  async delete(key: string) {
    await rm(this.pathFor(key), { force: true });
  }

  /** Solo claves con formato UUID v4, y siempre dentro del directorio raiz (sin path traversal). */
  private pathFor(key: string) {
    if (!KEY_PATTERN.test(key)) {
      throw new Error("Clave de almacenamiento invalida");
    }

    const path = join(this.root, key);
    const fromRoot = relative(this.root, path);

    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
      throw new Error("Clave de almacenamiento fuera del directorio");
    }

    return path;
  }
}

/** Sin almacenamiento configurado: el modulo documental responde 503 (DEC-029). */
export class DisabledStorage implements StorageService {
  readonly driver = "none" as const;

  async put(): Promise<void> {
    throw STORAGE_NOT_CONFIGURED();
  }

  async get(): Promise<Buffer> {
    throw STORAGE_NOT_CONFIGURED();
  }

  async delete(): Promise<void> {
    throw STORAGE_NOT_CONFIGURED();
  }
}

export interface DocumentsConfig {
  driver: StorageDriver;
  directory: string;
  maxBytes: number;
}

const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;

/**
 * `STORAGE_DRIVER`: `local` (por defecto fuera de produccion) o `none`. En produccion `local` se
 * rechaza y el valor por defecto es `none` hasta elegir un proveedor privado (DEC-029).
 */
export function loadDocumentsConfig(env: NodeJS.ProcessEnv = process.env): DocumentsConfig {
  const production = env.NODE_ENV === "production";
  const driver = (env.STORAGE_DRIVER || (production ? "none" : "local")) as StorageDriver;

  if (driver !== "local" && driver !== "none") {
    throw new Error(`STORAGE_DRIVER invalido: "${driver}" (permitidos: local, none)`);
  }

  if (production && driver === "local") {
    throw new Error("STORAGE_DRIVER=local no se admite en produccion: el disco del servidor no es un almacenamiento privado persistente");
  }

  const maxBytes = Number(env.DOCUMENT_MAX_BYTES || DEFAULT_MAX_BYTES);

  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("DOCUMENT_MAX_BYTES debe ser un entero positivo");
  }

  return { driver, directory: env.DOCUMENTS_DIR || "./data/documents", maxBytes };
}

export function createStorage(config: DocumentsConfig): StorageService {
  return config.driver === "local" ? new LocalDiskStorage(config.directory) : new DisabledStorage();
}
