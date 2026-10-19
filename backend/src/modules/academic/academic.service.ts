import { Inject, Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, type EntityManager, In } from "typeorm";
import { ApiError } from "../../common/api-error";
import { recordAudit } from "../audit/audit";
import { DocumentsService } from "../documents/documents.service";
import { DocumentRecord } from "../documents/document.entity";
import { actorRoles, type Actor, loadManageableProject } from "../projects/project-access";
import { ProjectMember } from "../projects/project-member.entity";
import { Project } from "../projects/project.entity";
import { isCalendarDate } from "../projects/projects.service";
import { ResearchResult } from "../research/research.entities";
import { isAuthority } from "../roles/role-policy";
import { User } from "../users/user.entity";
import { AcademicProduct, AcademicProductResult, ProductAuthor, Recognition } from "./academic.entities";
import type { ListAcademicQuery, SaveProductDto, SaveRecognitionDto } from "./academic.dto";

const missing = () => new ApiError(404, "ACADEMIC_NOT_FOUND", "Registro academico no encontrado");
const forbidden = () => new ApiError(403, "ACADEMIC_FORBIDDEN", "No tienes permiso para gestionar este registro");
const invalid = (message: string) => new ApiError(400, "ACADEMIC_INVALID", message);
const authority = (actor: Actor) => isAuthority(actorRoles(actor));

@Injectable()
export class AcademicService {
  constructor(@InjectDataSource() private readonly db: DataSource, @Inject(DocumentsService) private readonly documents: DocumentsService) {}

  /** Filtra permisos en SQL antes de contar y paginar; no revela totales ajenos. */
  async list(actor: Actor, query: ListAcademicQuery, recognition = false) {
    const builder = recognition ? this.db.createQueryBuilder(Recognition, "a") : this.db.createQueryBuilder(AcademicProduct, "a");
    if (!authority(actor)) {
      const projectAccess = "EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = a.project_id AND m.user_id = :viewer)";
      builder.andWhere(recognition ? `(a.user_id = :viewer OR ${projectAccess})` : `(a.project_id IS NULL OR ${projectAccess})`, { viewer: actor.id });
    }
    if (query.q) builder.andWhere("LOWER(a.title) LIKE LOWER(:q) ESCAPE '\\'", { q: `%${query.q.replace(/[\\%_]/g, "\\$&")}%` });
    if (query.projectId) builder.andWhere("a.project_id = :projectId", { projectId: query.projectId });
    if (query.authorId) builder.andWhere(recognition ? "a.user_id = :author" : "EXISTS (SELECT 1 FROM product_authors pa WHERE pa.product_id = a.id AND pa.user_id = :author)", { author: query.authorId });
    if (!recognition && query.type) builder.andWhere("a.type = :type", { type: query.type });
    if (!recognition && query.status) builder.andWhere("a.status = :status", { status: query.status });
    const [rows, total] = await builder.orderBy("a.created_at", "DESC").addOrderBy("a.id", "ASC").skip((query.page - 1) * query.pageSize).take(query.pageSize).getManyAndCount();
    const items = await Promise.all(rows.map(row => recognition ? this.recognitionView(this.db.manager, actor, row as Recognition) : this.productView(this.db.manager, actor, row as AcademicProduct)));
    return { items, total, page: query.page, pageSize: query.pageSize, permissions: { canCreateInstitutional: authority(actor) } };
  }

  async product(actor: Actor, id: string) {
    const product = await this.db.manager.findOneBy(AcademicProduct, { id });
    if (!product || !await this.readable(this.db.manager, actor, product.projectId)) throw missing();
    return this.productView(this.db.manager, actor, product);
  }

  async saveProduct(actor: Actor, dto: SaveProductDto, id?: string) {
    return this.db.transaction(async m => {
      const existing = id ? await m.findOneBy(AcademicProduct, { id }) : null;
      if (id && !existing) throw missing();
      if (existing) await this.manage(m, actor, existing.projectId);
      const projectId = dto.projectId || null;
      await this.manage(m, actor, projectId);
      if (dto.productDate && !isCalendarDate(dto.productDate)) throw invalid("La fecha del producto no es valida");
      const oldAuthors = existing ? await m.findBy(ProductAuthor, { productId: existing.id }) : [];
      const seen = new Set<string>();
      for (const author of dto.authors) {
        if (Boolean(author.userId) === Boolean(author.externalName?.trim())) throw invalid("Cada autoria debe tener un integrante o un nombre externo, exclusivamente");
        const key = author.userId || author.externalName!.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) throw invalid("No se permiten autores duplicados");
        seen.add(key);
        if (author.userId) {
          const user = await m.findOneBy(User, { id: author.userId });
          const retained = existing?.projectId === projectId && oldAuthors.some(a => a.userId === author.userId);
          if (!user || (!retained && user.accountStatus !== "active")) throw invalid("El autor interno debe ser un integrante activo");
          if (projectId && !retained && !await m.existsBy(ProjectMember, { projectId, userId: author.userId })) throw invalid("El autor interno debe pertenecer al proyecto");
        } else if (author.externalName!.trim().length < 2) throw invalid("El nombre del autor externo es demasiado corto");
      }
      const resultIds = dto.resultIds ?? [];
      for (const resultId of resultIds) {
        if (!projectId || !await m.existsBy(ResearchResult, { id: resultId, projectId })) throw invalid("El resultado debe pertenecer al proyecto del producto");
      }
      // Borrar enlaces antes de cambiar proyecto conserva la FK compuesta durante la transaccion.
      if (existing) {
        await m.delete(AcademicProductResult, { productId: existing.id });
        await m.delete(ProductAuthor, { productId: existing.id });
      }
      const product = await m.save(AcademicProduct, m.create(AcademicProduct, {
        ...(existing ?? {}), title: dto.title, type: dto.type, status: dto.status,
        description: dto.description || null, source: dto.source || null, doi: dto.doi || null, url: dto.url || null,
        productDate: dto.productDate || null, projectId, createdBy: existing ? existing.createdBy : actor.id,
      }));
      await m.save(ProductAuthor, dto.authors.map((author, index) => m.create(ProductAuthor, { productId: product.id, position: index + 1, userId: author.userId || null, externalName: author.externalName?.trim() || null })));
      if (resultIds.length) await m.save(AcademicProductResult, resultIds.map(resultId => m.create(AcademicProductResult, { productId: product.id, resultId, projectId: projectId! })));
      await this.audit(m, actor, id ? "academic_product.updated" : "academic_product.created", product.id);
      return this.productView(m, actor, product);
    });
  }

  async recognition(actor: Actor, id: string) {
    const row = await this.db.manager.findOneBy(Recognition, { id });
    if (!row || !await this.recognitionReadable(this.db.manager, actor, row)) throw missing();
    return this.recognitionView(this.db.manager, actor, row);
  }

  async saveRecognition(actor: Actor, dto: SaveRecognitionDto, id?: string) {
    return this.db.transaction(async m => {
      const existing = id ? await m.findOneBy(Recognition, { id }) : null;
      if (id && !existing) throw missing();
      if (existing && !await this.recognitionReadable(m, actor, existing)) throw missing();
      if (existing) await this.manage(m, actor, existing.projectId);
      const projectId = dto.projectId || null;
      await this.manage(m, actor, projectId);
      if (!dto.userId && !projectId) throw invalid("El reconocimiento debe vincularse a un integrante o proyecto");
      if (!isCalendarDate(dto.recognitionDate)) throw invalid("La fecha del reconocimiento no es valida");
      if (dto.userId) {
        const user = await m.findOneBy(User, { id: dto.userId });
        if (!user || (user.accountStatus !== "active" && existing?.userId !== user.id)) throw invalid("El participante debe ser un integrante activo");
        const retained = existing?.projectId === projectId && existing?.userId === dto.userId;
        if (projectId && !retained && !await m.existsBy(ProjectMember, { projectId, userId: dto.userId })) throw invalid("El participante debe pertenecer al proyecto");
      }
      if (dto.evidenceDocumentId) {
        await this.documents.detail(actor, dto.evidenceDocumentId);
        const document = await m.findOneByOrFail(DocumentRecord, { id: dto.evidenceDocumentId });
        if (document.projectId !== projectId) throw invalid("La evidencia debe pertenecer al mismo ambito del reconocimiento");
      }
      const row = await m.save(Recognition, m.create(Recognition, { ...(existing ?? {}), title: dto.title, description: dto.description || null,
        recognitionDate: dto.recognitionDate, userId: dto.userId || null, projectId,
        evidenceDocumentId: dto.evidenceDocumentId || null, createdBy: existing ? existing.createdBy : actor.id }));
      await this.audit(m, actor, id ? "recognition.updated" : "recognition.created", row.id);
      return this.recognitionView(m, actor, row);
    });
  }

  async remove(actor: Actor, id: string, recognition = false) {
    return this.db.transaction(async m => {
      const target = recognition ? Recognition : AcademicProduct;
      const row = recognition ? await m.findOneBy(Recognition, { id }) : await m.findOneBy(AcademicProduct, { id });
      if (!row) throw missing();
      if (recognition && !await this.recognitionReadable(m, actor, row as Recognition)) throw missing();
      await this.manage(m, actor, row.projectId);
      await m.delete(target, { id });
      await this.audit(m, actor, recognition ? "recognition.deleted" : "academic_product.deleted", id);
    });
  }

  private async readable(m: EntityManager, actor: Actor, projectId: string | null) {
    return !projectId || authority(actor) || await m.existsBy(ProjectMember, { projectId, userId: actor.id });
  }
  private async recognitionReadable(m: EntityManager, actor: Actor, row: Recognition) {
    return authority(actor) || row.userId === actor.id || (row.projectId !== null && await this.readable(m, actor, row.projectId));
  }
  private async manage(m: EntityManager, actor: Actor, projectId: string | null) {
    if (projectId) await loadManageableProject(m, actor, projectId);
    else if (!authority(actor)) throw forbidden();
  }
  private async canManage(m: EntityManager, actor: Actor, projectId: string | null) {
    if (!projectId) return authority(actor);
    const project = await m.findOneBy(Project, { id: projectId });
    if (!project || ["completed", "cancelled"].includes(project.status)) return false;
    return authority(actor) || await m.existsBy(ProjectMember, { projectId, userId: actor.id, role: "leader" });
  }
  private async productView(m: EntityManager, actor: Actor, product: AcademicProduct) {
    const [authors, links, project, canManage] = await Promise.all([
      m.find(ProductAuthor, { where: { productId: product.id }, order: { position: "ASC" } }),
      m.findBy(AcademicProductResult, { productId: product.id }),
      product.projectId ? m.findOneBy(Project, { id: product.projectId }) : null,
      this.canManage(m, actor, product.projectId),
    ]);
    const ids = authors.flatMap(a => a.userId ? [a.userId] : []);
    const users = ids.length ? await m.findBy(User, { id: In(ids) }) : [];
    const results = links.length ? await m.findBy(ResearchResult, { id: In(links.map(l => l.resultId)) }) : [];
    return { ...product, project: project ? { id: project.id, name: project.name } : null,
      authors: authors.map(a => ({ userId: a.userId, externalName: a.externalName, position: a.position, fullName: a.externalName ?? users.find(u => u.id === a.userId)?.fullName ?? "Integrante" })),
      results: results.map(r => ({ id: r.id, title: r.title })), permissions: { canManage } };
  }
  private async recognitionView(m: EntityManager, actor: Actor, row: Recognition) {
    const [project, user, canManage] = await Promise.all([
      row.projectId && await this.readable(m, actor, row.projectId) ? m.findOneBy(Project, { id: row.projectId }) : null,
      row.userId ? m.findOneBy(User, { id: row.userId }) : null,
      this.canManage(m, actor, row.projectId),
    ]);
    let evidence: { id: string; title: string } | null = null;
    if (row.evidenceDocumentId) {
      try { const doc = await this.documents.detail(actor, row.evidenceDocumentId); evidence = { id: doc.id, title: doc.title }; }
      catch (error) { if (!(error instanceof ApiError && error.getStatus() === 404)) throw error; }
    }
    return { ...row, projectId: project?.id ?? null, project: project ? { id: project.id, name: project.name } : null,
      user: user ? { id: user.id, fullName: user.fullName } : null, evidenceDocumentId: evidence?.id ?? null, evidence, permissions: { canManage } };
  }
  private audit(m: EntityManager, actor: Actor, action: string, id: string) {
    return recordAudit(m, { actorUserId: actor.id, action, targetType: action.startsWith("recognition") ? "recognition" : "academic_product", targetId: id });
  }
}
