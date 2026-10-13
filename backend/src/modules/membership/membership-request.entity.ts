import { randomUUID } from "node:crypto";

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Role } from "../roles/role.entity";
import { User } from "../users/user.entity";

export const MEMBERSHIP_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type MembershipRequestStatus = (typeof MEMBERSHIP_REQUEST_STATUSES)[number];

@Entity({ name: "membership_requests" })
export class MembershipRequest {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: MembershipRequestStatus;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ name: "approved_role_id", type: "varchar", length: 36, nullable: true })
  approvedRoleId!: string | null;

  @ManyToOne(() => Role, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({ name: "approved_role_id" })
  approvedRole!: Role | null;

  @Column({ name: "reviewed_by", type: "varchar", length: 36, nullable: true })
  reviewedBy!: string | null;

  @Column({ name: "reviewed_at", type: Date, nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: "review_comment", type: "text", nullable: true })
  reviewComment!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
