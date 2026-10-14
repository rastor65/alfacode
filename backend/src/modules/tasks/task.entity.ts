import { randomUUID } from "node:crypto";

import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { Project } from "../projects/project.entity";
import { User } from "../users/user.entity";

export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** F2-07. Una tarea pertenece siempre a un unico proyecto; `sprint_id` es opcional (backlog). */
@Entity({ name: "tasks" })
export class Task {
  @PrimaryColumn({ type: "varchar", length: 36 })
  id!: string;

  @Column({ name: "project_id", type: "varchar", length: 36 })
  projectId!: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project!: Project;

  /** Sin sprints hasta la Fase 2C: siempre `null` (backlog o modalidad tradicional). */
  @Column({ name: "sprint_id", type: "varchar", length: 36, nullable: true })
  sprintId!: string | null;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "assignee_id", type: "varchar", length: 36, nullable: true })
  assigneeId!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee!: User | null;

  @Column({ type: "varchar", length: 20, default: "todo" })
  status!: TaskStatus;

  @Column({ type: "varchar", length: 10, default: "medium" })
  priority!: TaskPriority;

  /** Fecha de calendario `YYYY-MM-DD`. */
  @Column({ name: "due_date", type: "varchar", length: 10, nullable: true })
  dueDate!: string | null;

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
