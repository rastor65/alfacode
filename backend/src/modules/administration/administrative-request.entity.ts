import { randomUUID } from "node:crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export const REQUEST_TYPES = ["certificate", "data_change", "withdrawal", "responsibility_change", "general"] as const;
export const REQUEST_STATUSES = ["pending", "in_review", "approved", "rejected", "completed"] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

@Entity({ name: "administrative_requests" })
export class AdministrativeRequest {
  @PrimaryColumn({ type: "varchar", length: 36 }) id!: string;
  @Column({ name: "requester_id", type: "varchar", length: 36 }) requesterId!: string;
  @Column({ type: "varchar", length: 30 }) type!: typeof REQUEST_TYPES[number];
  @Column({ type: "varchar", length: 200 }) subject!: string;
  @Column({ type: "text" }) description!: string;
  @Column({ type: "varchar", length: 20 }) status!: RequestStatus;
  @Column({ name: "reviewer_id", type: "varchar", length: 36, nullable: true }) reviewerId!: string | null;
  @Column({ type: "text", nullable: true }) response!: string | null;
  @Column({ name: "reviewed_by", type: "varchar", length: 36, nullable: true }) reviewedBy!: string | null;
  @Column({ name: "reviewed_at", type: "varchar", length: 24, nullable: true }) reviewedAt!: string | null;
  @Column({ name: "completed_by", type: "varchar", length: 36, nullable: true }) completedBy!: string | null;
  @Column({ name: "completed_at", type: "varchar", length: 24, nullable: true }) completedAt!: string | null;
  @CreateDateColumn({ name: "created_at", type: Date }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at", type: Date }) updatedAt!: Date;
  @BeforeInsert() assignId() { this.id ??= randomUUID(); }
}
