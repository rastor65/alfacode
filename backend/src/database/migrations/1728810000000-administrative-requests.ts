import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdministrativeRequests1728810000000 implements MigrationInterface {
  name = "AdministrativeRequests1728810000000";
  async up(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("AdministrativeRequests: PostgreSQL pendiente (DEC-039)");
    await q.query(`CREATE TABLE administrative_requests (
      id varchar(36) PRIMARY KEY NOT NULL,
      requester_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      type varchar(30) NOT NULL CHECK(type IN ('certificate','data_change','withdrawal','responsibility_change','general')),
      subject varchar(200) NOT NULL, description text NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_review','approved','rejected','completed')),
      reviewer_id varchar(36) REFERENCES users(id) ON DELETE RESTRICT,
      response text, reviewed_by varchar(36) REFERENCES users(id) ON DELETE RESTRICT, reviewed_at varchar(24),
      completed_by varchar(36) REFERENCES users(id) ON DELETE RESTRICT, completed_at varchar(24),
      created_at datetime NOT NULL DEFAULT (datetime('now')), updated_at datetime NOT NULL DEFAULT (datetime('now')),
      CHECK(reviewer_id IS NULL OR reviewer_id != requester_id),
      CHECK(reviewed_by IS NULL OR reviewed_by != requester_id),
      CHECK(completed_by IS NULL OR completed_by != requester_id))`);
    await q.query("CREATE INDEX idx_administrative_requester ON administrative_requests(requester_id,created_at)");
    await q.query("CREATE INDEX idx_administrative_review ON administrative_requests(status,reviewer_id)");
  }
  async down(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("AdministrativeRequests: PostgreSQL pendiente (DEC-039)");
    await q.query("DROP TABLE administrative_requests");
  }
}
