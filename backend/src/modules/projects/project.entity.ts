import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { ProjectMember } from "./project-member.entity";

export const PROJECT_TYPES = ["research", "software", "innovation", "extension", "internal", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_METHODOLOGIES = ["traditional", "agile"] as const;
export type ProjectMethodology = (typeof PROJECT_METHODOLOGIES)[number];

export const PROJECT_STATUSES = ["proposed", "planning", "active", "paused", "completed", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

@Entity({ name: "projects" })
export class Project {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20 })
  type!: ProjectType;

  @Column({ type: "varchar", length: 20 })
  methodology!: ProjectMethodology;

  @Column({ type: "varchar", length: 20, default: "proposed" })
  status!: ProjectStatus;

  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true })
  createdBy!: string | null;

  /** Fecha de calendario `YYYY-MM-DD`. */
  @Column({ name: "start_date", type: "varchar", length: 10, nullable: true })
  startDate!: string | null;

  @Column({ name: "end_date", type: "varchar", length: 10, nullable: true })
  endDate!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members!: ProjectMember[];

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
