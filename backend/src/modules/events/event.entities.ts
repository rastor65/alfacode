import { randomUUID } from "node:crypto";
import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export const EVENT_TYPES = ["meeting", "training", "academic", "call", "internal", "other"] as const;
export const EVENT_STATUSES = ["scheduled", "in_progress", "completed", "cancelled"] as const;
export const EVENT_MODES = ["onsite", "online", "hybrid"] as const;
export const PARTICIPANT_ROLES = ["participant", "speaker", "organizer"] as const;
export const ATTENDANCE_STATUSES = ["registered", "attended", "absent"] as const;

@Entity("events")
export class EventRecord {
  @PrimaryColumn({ type: "varchar", length: 36 }) id!: string;
  @Column({ type: "varchar", length: 200 }) title!: string;
  @Column({ type: "text", nullable: true }) description!: string | null;
  @Column({ type: "varchar", length: 20 }) type!: typeof EVENT_TYPES[number];
  @Column({ type: "varchar", length: 20 }) status!: typeof EVENT_STATUSES[number];
  @Column({ type: "varchar", length: 20 }) mode!: typeof EVENT_MODES[number];
  @Column({ name: "starts_at", type: "varchar", length: 24 }) startsAt!: string;
  @Column({ name: "ends_at", type: "varchar", length: 24 }) endsAt!: string;
  @Column({ type: "varchar", length: 500, nullable: true }) location!: string | null;
  @Column({ type: "varchar", length: 2000, nullable: true }) url!: string | null;
  @Column({ name: "organizer_id", type: "varchar", length: 36 }) organizerId!: string;
  @Column({ name: "project_id", type: "varchar", length: 36, nullable: true }) projectId!: string | null;
  @Column({ name: "external_organizer", type: "varchar", length: 200, nullable: true }) externalOrganizer!: string | null;
  @Column({ type: "text", nullable: true }) requirements!: string | null;
  @Column({ name: "registration_url", type: "varchar", length: 2000, nullable: true }) registrationUrl!: string | null;
  @Column({ name: "cancellation_reason", type: "varchar", length: 1000, nullable: true }) cancellationReason!: string | null;
  @Column({ name: "created_by", type: "varchar", length: 36, nullable: true }) createdBy!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
  @BeforeInsert() assignId() { this.id ??= randomUUID(); }
}

@Entity("event_participants")
export class EventParticipant {
  @PrimaryColumn({ name: "event_id", type: "varchar", length: 36 }) eventId!: string;
  @PrimaryColumn({ name: "user_id", type: "varchar", length: 36 }) userId!: string;
  @Column({ type: "varchar", length: 20 }) role!: typeof PARTICIPANT_ROLES[number];
  @Column({ type: "varchar", length: 20 }) attendance!: typeof ATTENDANCE_STATUSES[number];
  @Column({ name: "recorded_by", type: "varchar", length: 36, nullable: true }) recordedBy!: string | null;
  @Column({ name: "recorded_at", type: "varchar", length: 24, nullable: true }) recordedAt!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("event_documents")
export class EventDocument {
  @PrimaryColumn({ name: "event_id", type: "varchar", length: 36 }) eventId!: string;
  @PrimaryColumn({ name: "document_id", type: "varchar", length: 36 }) documentId!: string;
}
