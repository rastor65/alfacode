import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { Project } from "../projects/project.entity";
import { ResearchResult } from "../research/research.entities";
import { User } from "../users/user.entity";

export const DOCUMENT_SCOPES = ["project", "institutional"] as const;
export type DocumentScope = (typeof DOCUMENT_SCOPES)[number];

/** Tipos del documento de requisitos (seccion 7.2). */
export const DOCUMENT_CATEGORIES = [
  "minutes",
  "report",
  "certificate",
  "evidence",
  "project",
  "academic",
  "administrative",
  "other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** F3-08 y DEC-029. */
export const ACCESS_LEVELS = ["general", "restricted", "private"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

/** F3-05. Metadatos de un archivo; el contenido esta en el almacenamiento bajo `storageKey`. */
@Entity({ name: "documents" })
export class DocumentRecord {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 15 })
  scope!: DocumentScope;

  @Column({ name: "project_id", type: "varchar", length: 36, nullable: true })
  projectId!: string | null;

  @ManyToOne(() => Project, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "project_id" })
  project!: Project | null;

  @Column({ name: "research_result_id", type: "varchar", length: 36, nullable: true })
  researchResultId!: string | null;

  @ManyToOne(() => ResearchResult, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: "research_result_id" })
  researchResult!: ResearchResult | null;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: "other" })
  category!: DocumentCategory;

  @Column({ name: "access_level", type: "varchar", length: 12, default: "restricted" })
  accessLevel!: AccessLevel;

  @Column({ name: "original_name", type: "varchar", length: 255 })
  originalName!: string;

  @Column({ type: "varchar", length: 10 })
  extension!: string;

  @Column({ name: "mime_type", type: "varchar", length: 100 })
  mimeType!: string;

  @Column({ name: "size_bytes", type: "integer" })
  sizeBytes!: number;

  @Column({ type: "varchar", length: 64 })
  sha256!: string;

  /** Nunca sale de la API. */
  @Column({ name: "storage_key", type: "varchar", length: 64 })
  storageKey!: string;

  @Column({ name: "uploaded_by", type: "varchar", length: 36, nullable: true })
  uploadedBy!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "uploaded_by" })
  uploader!: User | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}

/** Personas autorizadas expresamente a un documento privado. */
@Entity({ name: "document_grants" })
export class DocumentGrant {
  @PrimaryColumn({ name: "document_id", type: "varchar", length: 36 })
  documentId!: string;

  @PrimaryColumn({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => DocumentRecord, { onDelete: "CASCADE" })
  @JoinColumn({ name: "document_id" })
  document!: DocumentRecord;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "granted_by", type: "varchar", length: 36, nullable: true })
  grantedBy!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;
}
