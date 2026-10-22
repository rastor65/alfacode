import type { MigrationInterface, QueryRunner } from "typeorm";

/** F6-05 (DEC-046): observaciones cualitativas del proyecto; sin persona evaluada ni puntaje. */
export class ProjectObservations1728830000000 implements MigrationInterface {
  name = "ProjectObservations1728830000000";
  async up(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("ProjectObservations: PostgreSQL pendiente (DEC-046)");
    await q.query(`CREATE TABLE project_observations (
      id varchar(36) PRIMARY KEY NOT NULL,
      project_id varchar(36) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      kind varchar(20) NOT NULL CHECK(kind IN ('progress','difficulty','result','general')),
      body text NOT NULL CHECK(length(body) BETWEEN 10 AND 5000),
      created_at datetime NOT NULL DEFAULT (datetime('now')))`);
    await q.query("CREATE INDEX idx_project_observations_project ON project_observations(project_id,created_at)");
  }
  async down(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("ProjectObservations: PostgreSQL pendiente (DEC-046)");
    await q.query("DROP TABLE project_observations");
  }
}
