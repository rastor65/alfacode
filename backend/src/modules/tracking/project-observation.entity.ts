import { randomUUID } from "node:crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

export const OBSERVATION_KINDS = ["progress", "difficulty", "result", "general"] as const;
export type ObservationKind = (typeof OBSERVATION_KINDS)[number];

/** F6-05: observacion cualitativa del proyecto; no se edita (se elimina y se registra de nuevo). */
@Entity("project_observations")
export class ProjectObservation {
  @PrimaryColumn({ type: "varchar", length: 36 }) id!: string;
  @Column({ name: "project_id", type: "varchar", length: 36 }) projectId!: string;
  @Column({ name: "author_id", type: "varchar", length: 36 }) authorId!: string;
  @Column({ type: "varchar", length: 20 }) kind!: ObservationKind;
  @Column({ type: "text" }) body!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @BeforeInsert() assignId() { this.id ??= randomUUID(); }
}
