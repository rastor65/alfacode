/**
 * F3-07. Validacion del tipo real de un archivo por su contenido (firma), sin dependencias.
 * Formatos admitidos por DEC-029: PDF, DOCX, XLSX, PPTX, PNG, JPEG y WebP.
 */

export type FileKind = "pdf" | "docx" | "xlsx" | "pptx" | "png" | "jpeg" | "webp";

export const FILE_KINDS: Record<FileKind, { extensions: string[]; mimeType: string }> = {
  pdf: { extensions: ["pdf"], mimeType: "application/pdf" },
  docx: { extensions: ["docx"], mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { extensions: ["xlsx"], mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pptx: { extensions: ["pptx"], mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  png: { extensions: ["png"], mimeType: "image/png" },
  jpeg: { extensions: ["jpg", "jpeg"], mimeType: "image/jpeg" },
  webp: { extensions: ["webp"], mimeType: "image/webp" },
};

export const ALLOWED_EXTENSIONS = Object.values(FILE_KINDS).flatMap((kind) => kind.extensions);

/** Parte principal que identifica cada formato de Office Open XML dentro del ZIP. */
const OOXML_MAIN_PART: Record<"docx" | "xlsx" | "pptx", string> = {
  docx: "word/document.xml",
  xlsx: "xl/workbook.xml",
  pptx: "ppt/presentation.xml",
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Extension en minusculas del nombre original, o cadena vacia. */
export function extensionOf(fileName: string) {
  const match = /\.([A-Za-z0-9]{1,10})$/.exec(fileName);
  return match ? match[1].toLowerCase() : "";
}

export function kindForExtension(extension: string): FileKind | null {
  for (const [kind, info] of Object.entries(FILE_KINDS) as [FileKind, (typeof FILE_KINDS)[FileKind]][]) {
    if (info.extensions.includes(extension)) {
      return kind;
    }
  }

  return null;
}

/**
 * Nombres de las entradas de un ZIP leidos de su directorio central, o `null` si el archivo no
 * es un ZIP bien formado. No descomprime nada.
 */
export function zipEntryNames(buffer: Buffer, maxEntries = 5000): string[] | null {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
    return null;
  }

  // El registro de fin de directorio esta en los ultimos 22 bytes + comentario (hasta 64 KiB).
  const searchStart = Math.max(0, buffer.length - 22 - 0xffff);
  let end = -1;

  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      end = offset;
      break;
    }
  }

  if (end === -1) {
    return null;
  }

  const entries = buffer.readUInt16LE(end + 10);
  const directoryOffset = buffer.readUInt32LE(end + 16);

  if (entries > maxEntries || directoryOffset >= end) {
    return null;
  }

  const names: string[] = [];
  let cursor = directoryOffset;

  for (let index = 0; index < entries; index += 1) {
    if (cursor + 46 > end || buffer.readUInt32LE(cursor) !== 0x02014b50) {
      return null;
    }

    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const nameEnd = cursor + 46 + nameLength;

    if (nameEnd > end) {
      return null;
    }

    names.push(buffer.toString("utf8", cursor + 46, nameEnd));
    cursor = nameEnd + extraLength + commentLength;
  }

  return names;
}

function isOoxml(buffer: Buffer, kind: "docx" | "xlsx" | "pptx") {
  const names = zipEntryNames(buffer);

  if (!names || !names.includes("[Content_Types].xml") || !names.includes(OOXML_MAIN_PART[kind])) {
    return false;
  }

  // Sin macros: los formatos admitidos son los .docx/.xlsx/.pptx sin VBA.
  return !names.some((name) => name.toLowerCase().endsWith("vbaproject.bin"));
}

/** Comprueba que el contenido corresponde al formato declarado por la extension. */
export function contentMatches(buffer: Buffer, kind: FileKind) {
  switch (kind) {
    case "pdf":
      return buffer.subarray(0, 5).toString("latin1") === "%PDF-";
    case "png":
      return buffer.subarray(0, 8).equals(PNG_SIGNATURE);
    case "jpeg":
      return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "webp":
      return buffer.subarray(0, 4).toString("latin1") === "RIFF" && buffer.subarray(8, 12).toString("latin1") === "WEBP";
    case "docx":
    case "xlsx":
    case "pptx":
      return isOoxml(buffer, kind);
  }
}

/**
 * Nombre original saneado para mostrarlo y para `Content-Disposition`: sin rutas, caracteres de
 * control ni separadores, y con longitud acotada. Nunca se usa para ubicar el archivo.
 */
export function sanitizeFileName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "").replace(/\s+/g, " ").trim();
  const extension = extensionOf(cleaned);
  const stem = extension ? cleaned.slice(0, -(extension.length + 1)) : cleaned;
  const shortStem = stem.slice(0, 200).replace(/^\.+/, "").trim() || "documento";
  return extension ? `${shortStem}.${extension}` : shortStem;
}
