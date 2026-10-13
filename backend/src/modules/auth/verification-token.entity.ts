import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { User } from "../users/user.entity";

export const VERIFICATION_TOKEN_PURPOSES = ["email_verification", "password_reset"] as const;

export type VerificationTokenPurpose = (typeof VERIFICATION_TOKEN_PURPOSES)[number];

@Entity({ name: "verification_tokens" })
export class VerificationToken {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "varchar", length: 30 })
  purpose!: VerificationTokenPurpose;

  @Column({ name: "token_hash", type: "varchar", length: 64, unique: true })
  tokenHash!: string;

  @Column({ name: "expires_at", type: Date })
  expiresAt!: Date;

  @Column({ name: "used_at", type: Date, nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
