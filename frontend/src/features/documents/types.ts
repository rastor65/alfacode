import type { PersonRef } from "@/features/research/types";

export type DocumentScope = "project" | "institutional";
export type DocumentCategory = "minutes" | "report" | "certificate" | "evidence" | "project" | "academic" | "administrative" | "other";
export type AccessLevel = "general" | "restricted" | "private";

/** Tipos del documento de requisitos (seccion 7.2). */
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  minutes: "Acta",
  report: "Informe",
  certificate: "Certificado",
  evidence: "Evidencia",
  project: "Documento de proyecto",
  academic: "Documento académico",
  administrative: "Documento administrativo",
  other: "Otro",
};

export const ACCESS_LABELS: Record<AccessLevel, string> = {
  general: "General",
  restricted: "Restringido",
  private: "Privado",
};

/** Quien ve cada nivel (DEC-029), segun el ambito. */
export function accessHint(level: AccessLevel, scope: DocumentScope) {
  switch (level) {
    case "general":
      return "Todos los integrantes del semillero.";
    case "restricted":
      return scope === "project" ? "El equipo del proyecto y la coordinación." : "Solo la coordinación.";
    case "private":
      return "Tú, las personas que autorices, y la coordinación.";
  }
}

export type DocumentItem = {
  id: string;
  scope: DocumentScope;
  project: { id: string; name: string } | null;
  researchResult: { id: string; title: string } | null;
  title: string;
  description: string | null;
  category: DocumentCategory;
  accessLevel: AccessLevel;
  originalName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: PersonRef | null;
  createdAt: string;
  updatedAt: string;
  /** Solo para quien gestiona un documento privado. */
  grantedUsers?: PersonRef[];
  permissions: { canEdit: boolean; canDelete: boolean };
};

export type UploadLimits = { maxBytes: number; extensions: string[]; enabled: boolean };

export type DocumentList = {
  items: DocumentItem[];
  page: number;
  pageSize: number;
  total: number;
  permissions: { canUploadInstitutional: boolean; canUpload?: boolean };
  upload: UploadLimits;
};

export function downloadHref(id: string) {
  return `/api/v1/documents/${id}/download`;
}

/** Tamano legible en unidades binarias (KB = 1024 B), como el limite del plan (20 MiB). */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? Math.round(megabytes) : megabytes.toFixed(1).replace(/\.0$/, "")} MB`;
}

/** Valor del atributo `accept` del selector de archivos. */
export function acceptAttribute(extensions: readonly string[]) {
  return extensions.map((extension) => `.${extension}`).join(",");
}

/**
 * Comprobacion previa en el navegador (extension y tamano) para avisar antes de enviar. El
 * backend valida ademas el contenido real.
 */
export function checkFile(file: { name: string; size: number }, limits: Pick<UploadLimits, "maxBytes" | "extensions">) {
  const extension = /\.([A-Za-z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase() ?? "";

  if (!limits.extensions.includes(extension)) {
    return `Formato no permitido. Usa: ${limits.extensions.map((item) => item.toUpperCase()).join(", ")}.`;
  }

  if (file.size === 0) {
    return "El archivo está vacío.";
  }

  if (file.size > limits.maxBytes) {
    return `El archivo pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(limits.maxBytes)}.`;
  }

  return null;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCategory(value: string | string[] | undefined): DocumentCategory | undefined {
  const candidate = first(value);
  return candidate && Object.hasOwn(CATEGORY_LABELS, candidate) ? (candidate as DocumentCategory) : undefined;
}

export function parseScope(value: string | string[] | undefined): DocumentScope | undefined {
  const candidate = first(value);
  return candidate === "project" || candidate === "institutional" ? candidate : undefined;
}
