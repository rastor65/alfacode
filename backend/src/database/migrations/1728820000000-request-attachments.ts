import type { MigrationInterface, QueryRunner } from "typeorm";
export class RequestAttachments1728820000000 implements MigrationInterface {
  name = "RequestAttachments1728820000000";
  async up(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("RequestAttachments: PostgreSQL pendiente (DEC-041)");
    await q.query(`CREATE TABLE administrative_request_documents (
      document_id varchar(36) PRIMARY KEY NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      request_id varchar(36) NOT NULL REFERENCES administrative_requests(id) ON DELETE RESTRICT)`);
    await q.query("CREATE INDEX idx_request_documents_request ON administrative_request_documents(request_id)");
  }
  async down(q: QueryRunner) { await q.query("DROP TABLE administrative_request_documents"); }
}
