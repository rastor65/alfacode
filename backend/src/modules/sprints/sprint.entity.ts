import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { Project } from "../projects/project.entity";
import type { TaskStatus } from "../tasks/task.entity";

export const SPRINT_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

/** F2-13. Solo existe en proyectos agiles; como maximo uno `active` por proyecto (F2-14). */
@Entity({ name: "sprints" })
export class Sprint {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ type: "text", nullable: true })
  goal!: string | null;

  /** Fechas de calendario `YYYY-MM-DD`. */
  @Column({ name: "start_date", type: "varchar", length: 10 })
  startDate!: string;

  @Column({ name: "end_date", type: "varchar", length: 10 })
  endDate!: string;

  @Column({ type: "varchar", length: 20, default: "planned" })
  status!: SprintStatus;

  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true })
  createdBy!: string | null;

  @Column({ name: "started_at", type: Date, nullable: true })
  startedAt!: Date | null;

  /** Momento del cierre o de la cancelacion. */
  @Column({ name: "finished_at", type: Date, nullable: true })
  finishedAt!: Date | null;

  @Column({ name: "cancel_reason", type: "varchar", length: 500, nullable: true })
  cancelReason!: string | null;

  @CreateDateColumn({ name: "created_at", type: Date })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: Date })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}

/** F2-17: estado final de cada tarea del sprint; se escribe una vez y no se modifica. */
@Entity({ name: "sprint_closure_items" })
export class SprintClosureItem {
  @PrimaryColumn({ name: "sprint_id", type: "varchar", length: 36 })
  sprintId!: string;

  @PrimaryColumn({ name: "task_id", type: "varchar", length: 36 })
  taskId!: string;

  @Column({ name: "status_at_close", type: "varchar", length: 20 })
  statusAtClose!: TaskStatus;

  @Column({ name: "closed_at", type: Date })
  closedAt!: Date;
}
