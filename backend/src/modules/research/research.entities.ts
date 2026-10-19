import { randomUUID } from "node:crypto";

import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  JoinTable,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Project } from "../projects/project.entity";
import { User } from "../users/user.entity";

export const RESEARCH_LINE_STATUSES = ["active", "inactive"] as const;
export type ResearchLineStatus = (typeof RESEARCH_LINE_STATUSES)[number];

/** Clasificacion de resultados del documento de requisitos (seccion 4.6). */
export const RESEARCH_RESULT_TYPES = ["finding", "prototype", "methodological", "other"] as const;
export type ResearchResultType = (typeof RESEARCH_RESULT_TYPES)[number];

/** F3-01. Linea de investigacion institucional del semillero. */
@Entity({ name: "research_lines" })
export class ResearchLine {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  /** Nombre comparable (minusculas, sin tildes ni espacios repetidos) para impedir duplicados. */
  @Column({ name: "name_normalized", type: "varchar", length: 160 })
  nameNormalized!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  objectives!: string | null;

  @Column({ name: "responsible_user_id", type: "varchar", length: 36, nullable: true })
  responsibleUserId!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "responsible_user_id" })
  responsible!: User | null;

  @Column({ type: "varchar", length: 10, default: "active" })
  status!: ResearchLineStatus;

  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}

/** F3-02. Asociacion N:M entre proyectos y lineas. */
@Entity({ name: "project_research_lines" })
export class ProjectResearchLine {
  @PrimaryColumn({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @PrimaryColumn({ name: "research_line_id", type: "varchar", length: 36 })
  researchLineId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @ManyToOne(() => ResearchLine, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "research_line_id" })
  researchLine!: ResearchLine;

  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;
}

/** F3-03. Ficha investigativa opcional; como mucho una por proyecto. */
@Entity({ name: "project_research_profiles" })
export class ProjectResearchProfile {
  @PrimaryColumn({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "text", nullable: true })
  problem!: string | null;

  @Column({ type: "text", nullable: true })
  question!: string | null;

  @Column({ type: "text", nullable: true })
  justification!: string | null;

  @Column({ type: "text", nullable: true })
  methodology!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "updated_by", type: "varchar", length: 36, nullable: true })
  updatedBy!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "updated_by" })
  editor!: User | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;
}

/** F3-04. Resultado investigativo de un proyecto, con sus participantes. */
@Entity({ name: "research_results" })
export class ResearchResult {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: "finding" })
  type!: ResearchResultType;

  /** Fecha de calendario `YYYY-MM-DD`. */
  @Column({ name: "result_date", type: "varchar", length: 10, nullable: true })
  resultDate!: string | null;

  /** Referencias documentales en texto libre; los archivos se vinculan en I-15 (documentos). */
  @Column({ type: "text", nullable: true })
  references!: string | null;

  @ManyToMany(() => User)
  @JoinTable({
    name: "research_result_participants",
    joinColumn: { name: "result_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  participants!: User[];

  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "created_by" })
  creator!: User | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
