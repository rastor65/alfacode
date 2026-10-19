import { randomUUID } from "node:crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export const PRODUCT_TYPES = ["article", "presentation", "poster", "book_chapter", "book", "software", "other"] as const;
export const PRODUCT_STATUSES = ["in_progress", "submitted", "accepted", "published", "rejected"] as const;

@Entity("academic_products")
export class AcademicProduct {
  @PrimaryColumn({ type: "varchar", length: 36 }) id!: string;
  @Column({ type: "varchar", length: 20 }) type!: typeof PRODUCT_TYPES[number];
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ type: "varchar", length: 20 }) status!: typeof PRODUCT_STATUSES[number];
  @Column({ name: "product_date", type: "varchar", length: 10, nullable: true }) productDate!: string | null;
  @Column({ type: "varchar", length: 300, nullable: true }) source!: string | null;
  @Column({ type: "varchar", length: 200, nullable: true }) doi!: string | null;
  @Column({ type: "varchar", length: 2000, nullable: true }) url!: string | null;
  @Column({ name: "project_id", type: "varchar", length: 36, nullable: true }) projectId!: string | null;
  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true }) createdBy!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
  @BeforeInsert() assignId() { this.id ??= randomUUID(); }
}

@Entity("product_authors")
export class ProductAuthor {
  @PrimaryColumn({ name: "product_id", type: "varchar", length: 36 }) productId!: string;
  @PrimaryColumn({ type: "integer" }) position!: number;
  @Column({ name: "user_id", type: "varchar", length: 36, nullable: true }) userId!: string | null;
  @Column({ name: "external_name", type: "varchar", length: 160, nullable: true }) externalName!: string | null;
}

@Entity("academic_product_results")
export class AcademicProductResult {
  @PrimaryColumn({ name: "product_id", type: "varchar", length: 36 }) productId!: string;
  @PrimaryColumn({ name: "result_id", type: "varchar", length: 36 }) resultId!: string;
  @Column({ name: "project_id", type: "varchar", length: 36 }) projectId!: string;
}

@Entity("recognitions")
export class Recognition {
  @PrimaryColumn({ type: "varchar", length: 36 }) id!: string;
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ name: "recognition_date", type: "varchar", length: 10 }) recognitionDate!: string;
  @Column({ name: "user_id", type: "varchar", length: 36, nullable: true }) userId!: string | null;
  @Column({ name: "project_id", type: "varchar", length: 36, nullable: true }) projectId!: string | null;
  @Column({ name: "evidence_document_id", type: "varchar", length: 36, nullable: true }) evidenceDocumentId!: string | null;
  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true }) createdBy!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
  @BeforeInsert() assignId() { this.id ??= randomUUID(); }
}
