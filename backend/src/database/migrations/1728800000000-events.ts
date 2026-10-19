import type { MigrationInterface, QueryRunner } from "typeorm";
export class Events1728800000000 implements MigrationInterface {
  name = "Events1728800000000";
  async up(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("Events: migracion PostgreSQL pendiente (DEC-035)");
    await q.query(`CREATE TABLE events (
      id varchar(36) PRIMARY KEY NOT NULL, title varchar(200) NOT NULL, description text,
      type varchar(20) NOT NULL CHECK(type IN ('meeting','training','academic','call','internal','other')),
      status varchar(20) NOT NULL CHECK(status IN ('scheduled','in_progress','completed','cancelled')),
      mode varchar(20) NOT NULL CHECK(mode IN ('onsite','online','hybrid')),
      starts_at varchar(24) NOT NULL, ends_at varchar(24) NOT NULL CHECK(ends_at > starts_at),
      location varchar(500), url varchar(2000),
      organizer_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      project_id varchar(36) REFERENCES projects(id) ON DELETE RESTRICT,
      external_organizer varchar(200), requirements text, registration_url varchar(2000), cancellation_reason varchar(1000),
      created_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
      created_at datetime NOT NULL DEFAULT (datetime('now')), updated_at datetime NOT NULL DEFAULT (datetime('now')))`);
    await q.query(`CREATE TABLE event_participants (
      event_id varchar(36) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      role varchar(20) NOT NULL CHECK(role IN ('participant','speaker','organizer')),
      attendance varchar(20) NOT NULL DEFAULT 'registered' CHECK(attendance IN ('registered','attended','absent')),
      recorded_by varchar(36) REFERENCES users(id) ON DELETE SET NULL, recorded_at varchar(24),
      created_at datetime NOT NULL DEFAULT (datetime('now')), PRIMARY KEY(event_id,user_id))`);
    await q.query(`CREATE TABLE event_documents (
      event_id varchar(36) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      document_id varchar(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      PRIMARY KEY(event_id,document_id))`);
    await q.query("CREATE INDEX idx_events_dates ON events(starts_at,ends_at)");
    await q.query("CREATE INDEX idx_events_project ON events(project_id)");
    await q.query("CREATE INDEX idx_events_organizer ON events(organizer_id)");
    await q.query("CREATE INDEX idx_event_participant_user ON event_participants(user_id)");
  }
  async down(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("Events: migracion PostgreSQL pendiente (DEC-035)");
    for (const table of ["event_documents", "event_participants", "events"]) await q.query(`DROP TABLE ${table}`);
  }
}
