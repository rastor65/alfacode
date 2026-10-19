import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

import { DtoValidationPipe } from "../../common/dto-validation.pipe";
import { type AuthContext, CurrentAuth } from "../auth/auth.decorators";
import { DocumentsService, type UploadedFileData, contentDisposition } from "./documents.service";
import { ListDocumentsQuery, UpdateDocumentDto, UploadDocumentDto } from "./dto/documents.dto";

const uuid = new ParseUUIDPipe({ version: "4" });

/** F3-05 a F3-09: repositorio documental. La carga es `multipart/form-data` con el archivo en `file`. */
@Controller()
export class DocumentsController {
  constructor(
    @Inject(DocumentsService)
    private readonly documents: DocumentsService,
  ) {}

  @Get("documents")
  list(@CurrentAuth() auth: AuthContext, @Query(new DtoValidationPipe(ListDocumentsQuery)) query: ListDocumentsQuery) {
    return this.documents.list(auth.user, query);
  }

  /** Repositorio institucional (sin proyecto); solo la coordinacion. */
  @Post("documents")
  @UseInterceptors(FileInterceptor("file"))
  uploadInstitutional(
    @CurrentAuth() auth: AuthContext,
    @UploadedFile() file: UploadedFileData | undefined,
    @Body(new DtoValidationPipe(UploadDocumentDto)) dto: UploadDocumentDto,
  ) {
    return this.documents.uploadInstitutional(auth.user, file, dto);
  }

  @Get("projects/:projectId/documents")
  listForProject(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @Query(new DtoValidationPipe(ListDocumentsQuery)) query: ListDocumentsQuery,
  ) {
    return this.documents.listForProject(auth.user, projectId, query);
  }

  @Post("projects/:projectId/documents")
  @UseInterceptors(FileInterceptor("file"))
  uploadToProject(
    @CurrentAuth() auth: AuthContext,
    @Param("projectId", uuid) projectId: string,
    @UploadedFile() file: UploadedFileData | undefined,
    @Body(new DtoValidationPipe(UploadDocumentDto)) dto: UploadDocumentDto,
  ) {
    return this.documents.uploadToProject(auth.user, projectId, file, dto);
  }

  @Get("documents/:documentId")
  detail(@CurrentAuth() auth: AuthContext, @Param("documentId", uuid) documentId: string) {
    return this.documents.detail(auth.user, documentId);
  }

  /**
   * F3-07: siempre como adjunto, con el tipo validado al subirlo, sin ejecucion en el navegador
   * (`nosniff` y `sandbox`) y sin cache (cabecera global `no-store`). Se responde con Express
   * directamente: `StreamableFile` no se reconoce entre las copias ESM y CommonJS de Nest y se
   * serializaria como JSON. Los errores previos (404, 503) siguen pasando por el filtro comun.
   */
  @Get("documents/:documentId/download")
  async download(@CurrentAuth() auth: AuthContext, @Param("documentId", uuid) documentId: string, @Res() response: Response) {
    const file = await this.documents.download(auth.user, documentId);
    response.setHeader("Content-Type", file.mimeType);
    response.setHeader("Content-Length", String(file.content.length));
    response.setHeader("Content-Disposition", contentDisposition(file.fileName));
    response.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.end(file.content);
  }

  @Patch("documents/:documentId")
  update(
    @CurrentAuth() auth: AuthContext,
    @Param("documentId", uuid) documentId: string,
    @Body(new DtoValidationPipe(UpdateDocumentDto)) dto: UpdateDocumentDto,
  ) {
    return this.documents.update(auth.user, documentId, dto);
  }

  @Delete("documents/:documentId")
  @HttpCode(204)
  async remove(@CurrentAuth() auth: AuthContext, @Param("documentId", uuid) documentId: string) {
    await this.documents.remove(auth.user, documentId);
  }
}
