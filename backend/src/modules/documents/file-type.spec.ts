import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { docxFixture, jpegFixture, pdfFixture, pngFixture, zipFixture } from "../../testing/file-fixtures";
import { canManageDocument, canReadDocument, canUploadDocument, type DocumentViewer } from "./document-policy";
import { contentDisposition } from "./documents.service";
import { contentMatches, extensionOf, kindForExtension, sanitizeFileName, zipEntryNames } from "./file-type";
import { LocalDiskStorage, loadDocumentsConfig } from "./storage";

describe("tipo real de los archivos (F3-07)", () => {
  it("reconoce cada formato admitido por su contenido", () => {
    assert.equal(contentMatches(pdfFixture(), "pdf"), true);
    assert.equal(contentMatches(pngFixture(), "png"), true);
    assert.equal(contentMatches(jpegFixture(), "jpeg"), true);
    assert.equal(contentMatches(Buffer.from("RIFF\0\0\0\0WEBPVP8 "), "webp"), true);
    assert.equal(contentMatches(docxFixture(), "docx"), true);
    assert.equal(contentMatches(zipFixture({ "[Content_Types].xml": "", "xl/workbook.xml": "" }), "xlsx"), true);
    assert.equal(contentMatches(zipFixture({ "[Content_Types].xml": "", "ppt/presentation.xml": "" }), "pptx"), true);
  });

  it("rechaza contenidos que no corresponden a la extension", () => {
    assert.equal(contentMatches(pngFixture(), "pdf"), false);
    assert.equal(contentMatches(Buffer.from("<html><script>alert(1)</script>"), "pdf"), false);
    assert.equal(contentMatches(pdfFixture(), "png"), false);
    assert.equal(contentMatches(docxFixture(), "xlsx"), false);
    assert.equal(contentMatches(zipFixture({ "otro.txt": "x" }), "docx"), false);
    assert.equal(contentMatches(Buffer.from("PK\u0003\u0004 truncado"), "docx"), false);
  });

  it("rechaza documentos de Office con macros", () => {
    assert.equal(contentMatches(docxFixture({ "word/vbaProject.bin": "macro" }), "docx"), false);
  });

  it("lee los nombres del directorio central del ZIP", () => {
    assert.deepEqual(zipEntryNames(zipFixture({ "a.txt": "1", "b/c.xml": "2" })), ["a.txt", "b/c.xml"]);
    assert.equal(zipEntryNames(pdfFixture()), null);
  });

  it("solo admite las extensiones de DEC-029", () => {
    for (const extension of ["pdf", "docx", "xlsx", "pptx", "png", "jpg", "jpeg", "webp"]) {
      assert.notEqual(kindForExtension(extension), null, extension);
    }
    for (const extension of ["exe", "html", "svg", "zip", "docm", "js", ""]) {
      assert.equal(kindForExtension(extension), null, extension);
    }
    assert.equal(extensionOf("Informe.Final.PDF"), "pdf");
    assert.equal(extensionOf("sin-extension"), "");
  });
});

describe("nombres de archivo", () => {
  it("quita rutas, caracteres de control y separadores", () => {
    assert.equal(sanitizeFileName("../../etc/passwd.pdf"), "passwd.pdf");
    assert.equal(sanitizeFileName("C:\\Users\\x\\Acta  final.docx"), "Acta final.docx");
    assert.equal(sanitizeFileName('a\u0000b"<c>|.pdf'), "abc.pdf");
    assert.equal(sanitizeFileName(".pdf"), "documento.pdf");
    assert.equal(sanitizeFileName(`${"x".repeat(300)}.pdf`).length, 204);
  });

  it("el Content-Disposition fuerza la descarga y conserva el nombre en UTF-8", () => {
    const header = contentDisposition('Acta "reunión".pdf');
    assert.ok(header.startsWith('attachment; filename="Acta reunion.pdf"'), header);
    assert.ok(header.includes("filename*=UTF-8''Acta%20%22reuni%C3%B3n%22.pdf"), header);
  });
});

describe("almacenamiento local (F3-06)", () => {
  it("guarda, lee y borra por clave UUID dentro de su directorio", async () => {
    const directory = await mkdtemp(join(tmpdir(), "alfacode-storage-"));
    const storage = new LocalDiskStorage(directory);
    const key = "0b6c3a39-6a4a-4d3c-9a43-0f6a7e2c1f10";

    try {
      await storage.put(key, Buffer.from("contenido"));
      assert.equal((await storage.get(key)).toString(), "contenido");
      await assert.rejects(storage.put(key, Buffer.from("otro")), "no sobrescribe");
      await storage.delete(key);
      assert.deepEqual(await readdir(directory), []);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rechaza claves que no son UUID (path traversal)", async () => {
    const storage = new LocalDiskStorage(join(tmpdir(), "no-se-usa"));

    for (const key of ["../secreto", "..\\secreto", "/etc/passwd", "a/b", "", "0b6c3a39-6a4a-4d3c-9a43-0f6a7e2c1f10/.."]) {
      await assert.rejects(storage.get(key), /Clave de almacenamiento invalida/, key);
    }
  });

  it("en produccion no admite disco local y por defecto deja el modulo deshabilitado", () => {
    assert.equal(loadDocumentsConfig({ NODE_ENV: "development" }).driver, "local");
    assert.equal(loadDocumentsConfig({ NODE_ENV: "production" }).driver, "none");
    assert.throws(() => loadDocumentsConfig({ NODE_ENV: "production", STORAGE_DRIVER: "local" }), /no se admite en produccion/);
    assert.throws(() => loadDocumentsConfig({ STORAGE_DRIVER: "s3" }), /STORAGE_DRIVER invalido/);
    assert.throws(() => loadDocumentsConfig({ DOCUMENT_MAX_BYTES: "-1" }), /entero positivo/);
    assert.equal(loadDocumentsConfig({}).maxBytes, 20 * 1024 * 1024);
  });
});

describe("politica documental (F3-08, DEC-029)", () => {
  const base: DocumentViewer = { roles: ["student"], userId: "yo", projectAccess: "none", granted: false };

  it("general: cualquier integrante; restringido: el equipo; privado: dueno, autorizados y autoridades", () => {
    const owner = "otra";
    assert.equal(canReadDocument(base, { scope: "project", accessLevel: "general", uploadedBy: owner }), true);
    assert.equal(canReadDocument(base, { scope: "project", accessLevel: "restricted", uploadedBy: owner }), false);
    assert.equal(
      canReadDocument({ ...base, projectAccess: "collaborator" }, { scope: "project", accessLevel: "restricted", uploadedBy: owner }),
      true,
    );
    assert.equal(canReadDocument(base, { scope: "institutional", accessLevel: "restricted", uploadedBy: owner }), false);
    assert.equal(
      canReadDocument({ ...base, projectAccess: "leader" }, { scope: "project", accessLevel: "private", uploadedBy: owner }),
      false,
    );
    assert.equal(canReadDocument({ ...base, granted: true }, { scope: "project", accessLevel: "private", uploadedBy: owner }), true);
    assert.equal(canReadDocument(base, { scope: "project", accessLevel: "private", uploadedBy: "yo" }), true);
    assert.equal(
      canReadDocument({ ...base, roles: ["coordinator"] }, { scope: "institutional", accessLevel: "private", uploadedBy: owner }),
      true,
    );
  });

  it("gestionan quien lo subio, el lider (si lo ve) y las autoridades; suben equipo o coordinacion", () => {
    const restricted = { scope: "project" as const, accessLevel: "restricted" as const, uploadedBy: "otra" };
    assert.equal(canManageDocument({ ...base, projectAccess: "collaborator" }, restricted), false);
    assert.equal(canManageDocument({ ...base, projectAccess: "leader" }, restricted), true);
    assert.equal(canManageDocument({ ...base, projectAccess: "leader" }, { ...restricted, accessLevel: "private" }), false);
    assert.equal(canManageDocument({ ...base, granted: true }, { ...restricted, accessLevel: "private" }), false);

    assert.equal(canUploadDocument(["student"], "project", "collaborator"), true);
    assert.equal(canUploadDocument(["student"], "project", "none"), false);
    assert.equal(canUploadDocument(["teacher_leader"], "institutional", "none"), false);
    assert.equal(canUploadDocument(["coordinator"], "institutional", "none"), true);
  });
});
