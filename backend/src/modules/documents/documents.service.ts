import { createHash, randomUUID } from "node:crypto";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In, type SelectQueryBuilder } from "typeorm";

import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { type Actor, PROJECT_NOT_EDITABLE, actorRoles, isProjectEditable, loadProjectWithAccess } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { type ProjectAccess, projectAccess } from "../projects/project-policy";
import { Project } from "../projects/project.entity";
import { ResearchResult } from "../research/research.entities";
import { isAuthority } from "../roles/role-policy";
import { User } from "../users/user.entity";
import { type DocumentViewer, canManageDocument, canReadDocument, canUploadDocument } from "./document-policy";
import { type AccessLevel, DocumentGrant, DocumentRecord, type DocumentScope } from "./document.entity";
import type { ListDocumentsQuery, UpdateDocumentDto, UploadDocumentDto } from "./dto/documents.dto";
import { ALLOWED_EXTENSIONS, FILE_KINDS, contentMatches, extensionOf, kindForExtension, sanitizeFileName } from "./file-type";
import { STORAGE_NOT_CONFIGURED, STORAGE_SERVICE, type StorageService } from "./storage";
import { AdministrativeRequest } from "../administration/administrative-request.entity";
import { RequestAttachment } from "./request-attachment.entity";

export const DOCUMENTS_CONFIG = Symbol("DOCUMENTS_CONFIG");

/** Sin acceso se responde 404: un enlace o ID conocido no revela que el documento existe (F3-08). */
const DOCUMENT_NOT_FOUND = () => new ApiError(404, "DOCUMENT_NOT_FOUND", "Documento no encontrado");
const DOCUMENT_FORBIDDEN = () => new ApiError(403, "DOCUMENT_FORBIDDEN", "No tienes permiso para gestionar este documento");

/** Archivo recibido por multer (almacenamiento en memoria). */
export interface UploadedFileData {
  originalname: string;
  size: number;
  buffer: Buffer;
}

function likePattern(value: string) {
  return `%${value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/** `Content-Disposition` con el nombre original en ASCII y en UTF-8 (RFC 6266 / 5987). */
export function contentDisposition(fileName: string) {
  const ascii = fileName.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "documento";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger("DocumentsService");

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(STORAGE_SERVICE)
    private readonly storage: StorageService,
    @Inject(DOCUMENTS_CONFIG)
    private readonly config: { maxBytes: number },
  ) {}

  // ---------------------------------------------------------------- consulta

  /** Repositorio: documentos que la persona puede ver, institucionales y de proyectos (F3-09). */
  async list(actor: Actor, query: ListDocumentsQuery) {
    const builder = this.visibleQuery(actor);

    if (query.scope) builder.andWhere("document.scope = :scope", { scope: query.scope });
    if (query.projectId) builder.andWhere("document.projectId = :projectId", { projectId: query.projectId });

    return this.page(actor, builder, query);
  }

  /** Documentos de un proyecto; exige acceso al proyecto. */
  async listForProject(actor: Actor, projectId: string, query: ListDocumentsQuery) {
    const { project, access } = await loadProjectWithAccess(this.dataSource.manager, actor, projectId);
    const builder = this.visibleQuery(actor).andWhere("document.projectId = :projectId", { projectId });

    if (query.researchResultId) {
      builder.andWhere("document.researchResultId = :resultId", { resultId: query.researchResultId });
    }

    const page = await this.page(actor, builder, query);
    return { ...page, permissions: { canUpload: canUploadDocument(actorRoles(actor), "project", access) && isProjectEditable(project) } };
  }

  async detail(actor: Actor, id: string) {
    const manager = this.dataSource.manager;
    const { document, viewer } = await this.loadReadable(manager, actor, id);
    return this.documentView(manager, document, viewer, true);
  }

  /** F3-07: descarga solo a traves de este controlador y tras comprobar el acceso. */
  async download(actor: Actor, id: string) {
    const { document } = await this.loadReadable(this.dataSource.manager, actor, id);

    if (this.storage.driver === "none") {
      throw STORAGE_NOT_CONFIGURED();
    }

    const content = await this.storage.get(document.storageKey);
    return { content, mimeType: document.mimeType, fileName: document.originalName };
  }

  // ---------------------------------------------------------------- carga

  async requestDocuments(actor: Actor, requestId: string, query: ListDocumentsQuery) {
    await this.loadRequest(this.dataSource.manager, actor, requestId);
    return this.page(actor, this.visibleQuery(actor).andWhere(
      "EXISTS (SELECT 1 FROM administrative_request_documents rd WHERE rd.document_id = document.id AND rd.request_id = :requestId)", { requestId }), query);
  }

  async uploadForRequest(actor: Actor, requestId: string, file: UploadedFileData | undefined, dto: UploadDocumentDto) {
    const request = await this.loadRequest(this.dataSource.manager, actor, requestId);
    this.assertRequestUpload(actor, request);
    if ((dto.accessLevel && dto.accessLevel !== "private") || dto.grantedUserIds?.length || dto.researchResultId)
      throw new ApiError(400, "REQUEST_DOCUMENT_PRIVATE", "Los adjuntos de solicitudes son privados para el solicitante y las autoridades");
    return this.upload(actor, "institutional", null, file, { ...dto, accessLevel: "private", grantedUserIds: [], researchResultId: undefined }, requestId);
  }

  private async loadRequest(m: EntityManager, actor: Actor, id: string) {
    const request = await m.findOneBy(AdministrativeRequest, { id });
    if (!request || (request.requesterId !== actor.id && !isAuthority(actorRoles(actor)))) throw DOCUMENT_NOT_FOUND();
    return request;
  }
  private assertRequestUpload(actor: Actor, request: AdministrativeRequest) {
    const allowed = request.requesterId === actor.id ? ["pending", "in_review"] : ["pending", "in_review", "approved"];
    if (!allowed.includes(request.status)) throw new ApiError(409, "REQUEST_DOCUMENT_READ_ONLY", "La solicitud no admite cambios de adjuntos en este estado");
  }

  async uploadToProject(actor: Actor, projectId: string, file: UploadedFileData | undefined, dto: UploadDocumentDto) {
    const { project, access } = await loadProjectWithAccess(this.dataSource.manager, actor, projectId);

    if (!canUploadDocument(actorRoles(actor), "project", access)) {
      throw DOCUMENT_FORBIDDEN();
    }

    if (!isProjectEditable(project)) {
      throw PROJECT_NOT_EDITABLE();
    }

    return this.upload(actor, "project", project, file, dto);
  }

  async uploadInstitutional(actor: Actor, file: UploadedFileData | undefined, dto: UploadDocumentDto) {
    if (!canUploadDocument(actorRoles(actor), "institutional", "none")) {
      throw DOCUMENT_FORBIDDEN();
    }

    if (dto.researchResultId) {
      throw new ApiError(400, "VALIDATION_ERROR", "Un documento institucional no se vincula a resultados", [
        { field: "researchResultId", rules: ["projectOnly"] },
      ]);
    }

    return this.upload(actor, "institutional", null, file, dto);
  }

  private async upload(
    actor: Actor,
    scope: DocumentScope,
    project: Project | null,
    file: UploadedFileData | undefined,
    dto: UploadDocumentDto,
    requestId?: string,
  ) {
    if (this.storage.driver === "none") {
      throw STORAGE_NOT_CONFIGURED();
    }

    const validated = this.validateFile(file);
    const accessLevel = dto.accessLevel ?? (scope === "institutional" ? "general" : "restricted");
    const grantedUserIds = dto.grantedUserIds ?? [];
    this.assertGrantsAllowed(accessLevel, grantedUserIds);

    const storageKey = randomUUID();
    await this.storage.put(storageKey, validated.buffer);

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (requestId) this.assertRequestUpload(actor, await this.loadRequest(manager, actor, requestId));
        if (dto.researchResultId) {
          await this.assertResultInProject(manager, project!.id, dto.researchResultId);
        }

        await this.assertGrantees(manager, grantedUserIds);

        const document = await manager.save(
          manager.create(DocumentRecord, {
            scope,
            projectId: project?.id ?? null,
            researchResultId: dto.researchResultId ?? null,
            title: dto.title || validated.originalName.replace(/\.[^.]+$/, ""),
            description: dto.description || null,
            category: dto.category ?? "other",
            accessLevel,
            originalName: validated.originalName,
            extension: validated.extension,
            mimeType: validated.mimeType,
            sizeBytes: validated.buffer.length,
            sha256: createHash("sha256").update(validated.buffer).digest("hex"),
            storageKey,
            uploadedBy: actor.id,
          }),
        );

        await this.replaceGrants(manager, document.id, grantedUserIds, actor.id);
        if (requestId) {
          await manager.insert(RequestAttachment, { requestId, documentId: document.id });
          await recordAudit(manager, { actorUserId: actor.id, action: "administrative_request.document_added",
            targetType: "administrative_request", targetId: requestId, details: { documentId: document.id, title: document.title } });
        }
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: "document.uploaded",
          targetType: "document",
          targetId: document.id,
          details: {
            scope,
            projectId: document.projectId,
            researchResultId: document.researchResultId,
            accessLevel,
            mimeType: document.mimeType,
            sizeBytes: document.sizeBytes,
            grantedUserIds,
          },
        });

        const loaded = await this.findDocument(manager, document.id);
        return this.documentView(manager, loaded, await this.viewerFor(manager, actor, loaded), true);
      });
    } catch (error) {
      // Sin metadatos el archivo quedaria huerfano: se elimina.
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  /** Extension permitida, contenido coherente con ella y tamano dentro del limite (F3-07). */
  private validateFile(file: UploadedFileData | undefined) {
    if (!file || !file.buffer || file.size === 0) {
      throw new ApiError(400, "FILE_REQUIRED", "Adjunta un archivo", [{ field: "file", rules: ["required"] }]);
    }

    if (file.buffer.length > this.config.maxBytes) {
      throw new ApiError(413, "FILE_TOO_LARGE", "El archivo supera el tamano maximo permitido", { maxBytes: this.config.maxBytes });
    }

    const originalName = sanitizeFileName(file.originalname);
    const extension = extensionOf(originalName);
    const kind = kindForExtension(extension);

    if (!kind) {
      throw new ApiError(415, "UNSUPPORTED_FILE_TYPE", "Tipo de archivo no permitido", { allowed: ALLOWED_EXTENSIONS });
    }

    if (!contentMatches(file.buffer, kind)) {
      throw new ApiError(415, "FILE_CONTENT_MISMATCH", "El contenido del archivo no corresponde a su extension");
    }

    return { buffer: file.buffer, originalName, extension, mimeType: FILE_KINDS[kind].mimeType };
  }

  // ---------------------------------------------------------------- gestion

  async update(actor: Actor, id: string, dto: UpdateDocumentDto) {
    return this.dataSource.transaction(async (manager) => {
      const { document, viewer } = await this.loadManageable(manager, actor, id);
      if (await manager.existsBy(RequestAttachment, { documentId: id }))
        throw new ApiError(409, "REQUEST_DOCUMENT_IMMUTABLE", "Los adjuntos de solicitudes conservan sus permisos; elimina y adjunta la correccion si procede");
      const changes: Partial<DocumentRecord> = {};

      if (dto.title !== undefined && dto.title !== document.title) changes.title = dto.title;
      if (dto.description !== undefined && (dto.description || null) !== document.description) {
        changes.description = dto.description || null;
      }
      if (dto.category !== undefined && dto.category !== document.category) changes.category = dto.category;
      if (dto.accessLevel !== undefined && dto.accessLevel !== document.accessLevel) changes.accessLevel = dto.accessLevel;
      if (dto.researchResultId !== undefined && dto.researchResultId !== document.researchResultId) {
        if (dto.researchResultId !== null) {
          if (document.scope !== "project") {
            throw new ApiError(400, "VALIDATION_ERROR", "Un documento institucional no se vincula a resultados", [
              { field: "researchResultId", rules: ["projectOnly"] },
            ]);
          }
          await this.assertResultInProject(manager, document.projectId!, dto.researchResultId);
        }
        changes.researchResultId = dto.researchResultId;
      }

      const accessLevel = changes.accessLevel ?? document.accessLevel;
      const previousGrants = await this.grantIds(manager, id);
      // Al dejar de ser privado, las autorizaciones expresas dejan de tener sentido y se retiran.
      let nextGrants = accessLevel === "private" ? previousGrants : [];

      if (dto.grantedUserIds !== undefined) {
        this.assertGrantsAllowed(accessLevel, dto.grantedUserIds);
        await this.assertGrantees(manager, dto.grantedUserIds.filter((userId) => !previousGrants.includes(userId)));
        nextGrants = dto.grantedUserIds;
      }

      const grantsChanged = [...nextGrants].sort().join() !== [...previousGrants].sort().join();

      if (Object.keys(changes).length > 0) {
        await manager.update(DocumentRecord, { id }, changes);
      }

      if (grantsChanged) {
        await this.replaceGrants(manager, id, nextGrants, actor.id);
      }

      if (Object.keys(changes).length > 0 || grantsChanged) {
        await recordAudit(manager, {
          actorUserId: actor.id,
          action: changes.accessLevel || grantsChanged ? "document.access_changed" : "document.updated",
          targetType: "document",
          targetId: id,
          details: {
            fields: Object.keys(changes),
            ...(changes.accessLevel ? { accessLevel: { from: document.accessLevel, to: changes.accessLevel } } : {}),
            ...(grantsChanged ? { grantedUserIds: { from: previousGrants, to: nextGrants } } : {}),
          },
        });
      }

      const loaded = await this.findDocument(manager, id);
      return this.documentView(manager, loaded, viewer, true);
    });
  }

  async remove(actor: Actor, id: string) {
    const storageKey = await this.dataSource.transaction(async (manager) => {
      const { document } = await this.loadManageable(manager, actor, id);
      const attachment = await manager.findOneBy(RequestAttachment, { documentId: id });

      await manager.delete(DocumentRecord, { id });
      if (attachment) await recordAudit(manager, { actorUserId: actor.id, action: "administrative_request.document_removed",
        targetType: "administrative_request", targetId: attachment.requestId, details: { documentId: id, title: document.title } });
      await recordAudit(manager, {
        actorUserId: actor.id,
        action: "document.deleted",
        targetType: "document",
        targetId: id,
        details: { scope: document.scope, projectId: document.projectId, title: document.title, sha256: document.sha256 },
      });

      return document.storageKey;
    });

    // Despues de confirmar: si falla, queda un archivo sin metadatos (inaccesible) y se registra.
    await this.storage.delete(storageKey).catch((error: unknown) => {
      this.logger.error(`No se pudo borrar el archivo del documento ${id}: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  // ---------------------------------------------------------------- comun

  /**
   * Filtro de visibilidad en la propia consulta (F3-08): una lista nunca incluye documentos que
   * la persona no puede ver, ni siquiera sus metadatos.
   */
  private visibleQuery(actor: Actor) {
    const builder = this.dataSource.manager
      .getRepository(DocumentRecord)
      .createQueryBuilder("document")
      .leftJoinAndSelect("document.uploader", "uploader")
      .leftJoinAndSelect("document.project", "project")
      .leftJoinAndSelect("document.researchResult", "result");

    if (!isAuthority(actorRoles(actor))) {
      builder.where(
        `((NOT EXISTS (SELECT 1 FROM administrative_request_documents rd WHERE rd.document_id = document.id)) AND (document.uploaded_by = :me
          OR document.access_level = 'general'
          OR (document.access_level = 'restricted' AND document.scope = 'project' AND EXISTS (
            SELECT 1 FROM project_members member WHERE member.project_id = document.project_id AND member.user_id = :me))
          OR (document.access_level = 'private' AND EXISTS (
            SELECT 1 FROM document_grants grant_row WHERE grant_row.document_id = document.id AND grant_row.user_id = :me)))
          OR EXISTS (SELECT 1 FROM administrative_request_documents rd INNER JOIN administrative_requests ar ON ar.id = rd.request_id
            WHERE rd.document_id = document.id AND ar.requester_id = :me))`,
        { me: actor.id },
      );
    }

    return builder;
  }

  private async page(actor: Actor, builder: SelectQueryBuilder<DocumentRecord>, query: ListDocumentsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    if (query.category) builder.andWhere("document.category = :category", { category: query.category });
    if (query.q) {
      builder.andWhere("(LOWER(document.title) LIKE :q ESCAPE '\\' OR LOWER(document.original_name) LIKE :q ESCAPE '\\')", {
        q: likePattern(query.q),
      });
    }

    builder.orderBy("document.createdAt", "DESC").addOrderBy("document.id", "ASC").offset((page - 1) * pageSize).limit(pageSize);

    const [documents, total] = await builder.getManyAndCount();
    const manager = this.dataSource.manager;
    const access = await this.projectAccessMap(manager, actor, documents);
    const grants = await this.grantedSet(manager, actor, documents);

    return {
      items: await Promise.all(
        documents.map((document) =>
          this.documentView(
            manager,
            document,
            {
              roles: actorRoles(actor),
              userId: actor.id,
              projectAccess: document.projectId ? access.get(document.projectId) ?? "none" : "none",
              granted: grants.has(document.id),
            },
            false,
          ),
        ),
      ),
      page,
      pageSize,
      total,
      permissions: { canUploadInstitutional: canUploadDocument(actorRoles(actor), "institutional", "none") },
      // La interfaz valida antes de enviar; el backend vuelve a comprobarlo todo.
      upload: { maxBytes: this.config.maxBytes, extensions: ALLOWED_EXTENSIONS, enabled: this.storage.driver !== "none" },
    };
  }

  private async projectAccessMap(manager: EntityManager, actor: Actor, documents: DocumentRecord[]) {
    const projectIds = [...new Set(documents.map((document) => document.projectId).filter((id): id is string => Boolean(id)))];
    const map = new Map<string, ProjectAccess>();

    if (projectIds.length === 0) {
      return map;
    }

    const memberships = await manager.findBy(ProjectMember, { projectId: In(projectIds), userId: actor.id });

    for (const projectId of projectIds) {
      const membership = memberships.find((member) => member.projectId === projectId);
      map.set(projectId, projectAccess(actorRoles(actor), membership?.role ?? null));
    }

    return map;
  }

  private async grantedSet(manager: EntityManager, actor: Actor, documents: DocumentRecord[]) {
    if (documents.length === 0) {
      return new Set<string>();
    }

    const rows = await manager.findBy(DocumentGrant, { documentId: In(documents.map((document) => document.id)), userId: actor.id });
    return new Set(rows.map((row) => row.documentId));
  }

  private async viewerFor(manager: EntityManager, actor: Actor, document: DocumentRecord): Promise<DocumentViewer> {
    const membership = document.projectId
      ? await manager.findOneBy(ProjectMember, { projectId: document.projectId, userId: actor.id })
      : null;

    return {
      roles: actorRoles(actor),
      userId: actor.id,
      projectAccess: document.projectId ? projectAccess(actorRoles(actor), membership?.role ?? null) : "none",
      granted: await manager.existsBy(DocumentGrant, { documentId: document.id, userId: actor.id }),
    };
  }

  private async findDocument(manager: EntityManager, id: string) {
    const document = await manager.findOne(DocumentRecord, {
      where: { id },
      relations: { uploader: true, project: true, researchResult: true },
    });

    if (!document) {
      throw DOCUMENT_NOT_FOUND();
    }

    return document;
  }

  private async loadReadable(manager: EntityManager, actor: Actor, id: string) {
    const document = await this.findDocument(manager, id);
    const viewer = await this.viewerFor(manager, actor, document);
    const attachment = await manager.findOneBy(RequestAttachment, { documentId: id });
    if (attachment) {
      await this.loadRequest(manager, actor, attachment.requestId);
      return { document, viewer };
    }

    if (!canReadDocument(viewer, document)) {
      throw DOCUMENT_NOT_FOUND();
    }

    return { document, viewer };
  }

  private async loadManageable(manager: EntityManager, actor: Actor, id: string) {
    const loaded = await this.loadReadable(manager, actor, id);
    const attachment = await manager.findOneBy(RequestAttachment, { documentId: id });
    if (attachment) {
      const request = await this.loadRequest(manager, actor, attachment.requestId);
      this.assertRequestUpload(actor, request);
      if (loaded.document.uploadedBy !== actor.id && !isAuthority(actorRoles(actor))) throw DOCUMENT_FORBIDDEN();
      return loaded;
    }

    if (!canManageDocument(loaded.viewer, loaded.document)) {
      throw DOCUMENT_FORBIDDEN();
    }

    if (loaded.document.project && !isProjectEditable(loaded.document.project)) {
      throw PROJECT_NOT_EDITABLE();
    }

    return loaded;
  }

  private assertGrantsAllowed(accessLevel: AccessLevel, grantedUserIds: string[]) {
    if (grantedUserIds.length > 0 && accessLevel !== "private") {
      throw new ApiError(400, "VALIDATION_ERROR", "Solo los documentos privados tienen personas autorizadas", [
        { field: "grantedUserIds", rules: ["privateOnly"] },
      ]);
    }
  }

  /** Las personas autorizadas deben ser integrantes activos del semillero. */
  private async assertGrantees(manager: EntityManager, userIds: string[]) {
    if (userIds.length === 0) {
      return;
    }

    const active = await manager.countBy(User, { id: In(userIds), accountStatus: "active" });

    if (active !== userIds.length) {
      throw new ApiError(409, "GRANTEE_NOT_ACTIVE", "Las personas autorizadas deben ser integrantes activos", [
        { field: "grantedUserIds", rules: ["activeUser"] },
      ]);
    }
  }

  private async assertResultInProject(manager: EntityManager, projectId: string, resultId: string) {
    if (!(await manager.existsBy(ResearchResult, { id: resultId, projectId }))) {
      throw new ApiError(404, "RESEARCH_RESULT_NOT_FOUND", "Resultado no encontrado en este proyecto");
    }
  }

  private async grantIds(manager: EntityManager, documentId: string) {
    return (await manager.findBy(DocumentGrant, { documentId })).map((grant) => grant.userId);
  }

  private async replaceGrants(manager: EntityManager, documentId: string, userIds: string[], grantedBy: string) {
    await manager.delete(DocumentGrant, { documentId });

    if (userIds.length > 0) {
      await manager.insert(
        DocumentGrant,
        userIds.map((userId) => ({ documentId, userId, grantedBy })),
      );
    }
  }

  private async documentView(manager: EntityManager, document: DocumentRecord, viewer: DocumentViewer, withGrants: boolean) {
    const attachment = await manager.findOneBy(RequestAttachment, { documentId: document.id });
    const request = attachment ? await manager.findOneByOrFail(AdministrativeRequest, { id: attachment.requestId }) : null;
    const canManage =
      canManageDocument(viewer, document) && (!document.project || isProjectEditable(document.project));
    const canRemoveAttachment = request && (document.uploadedBy === viewer.userId || isAuthority(viewer.roles)) &&
      (request.requesterId === viewer.userId ? ["pending", "in_review"] : ["pending", "in_review", "approved"]).includes(request.status);
    const grants =
      withGrants && canManage && document.accessLevel === "private"
        ? await manager.find(DocumentGrant, { where: { documentId: document.id }, relations: { user: true } })
        : [];

    return {
      id: document.id,
      scope: document.scope,
      administrativeRequestId: attachment?.requestId ?? null,
      project: document.project ? { id: document.project.id, name: document.project.name } : null,
      researchResult: document.researchResult ? { id: document.researchResult.id, title: document.researchResult.title } : null,
      title: document.title,
      description: document.description,
      category: document.category,
      accessLevel: document.accessLevel,
      originalName: document.originalName,
      extension: document.extension,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedBy: document.uploader ? { userId: document.uploader.id, fullName: document.uploader.fullName } : null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      // Solo quien gestiona el documento ve a quienes se autorizo.
      ...(withGrants && canManage ? { grantedUsers: grants.map((grant) => ({ userId: grant.user.id, fullName: grant.user.fullName })) } : {}),
      permissions: { canEdit: !attachment && canManage, canDelete: attachment ? Boolean(canRemoveAttachment) : canManage },
    };
  }
}
