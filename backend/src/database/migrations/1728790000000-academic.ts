import type { MigrationInterface, QueryRunner } from "typeorm";

export class Academic1728790000000 implements MigrationInterface {
  name = "Academic1728790000000";
  async up(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("Academic migration: PostgreSQL pendiente (DEC-033)");
    await q.query(`CREATE TABLE academic_products (
      id varchar(36) PRIMARY KEY NOT NULL, title varchar(200) NOT NULL,
      type varchar(20) NOT NULL CHECK(type IN ('article','presentation','poster','book_chapter','book','software','other')),
      status varchar(20) NOT NULL CHECK(status IN ('in_progress','submitted','accepted','published','rejected')),
      description text, product_date varchar(10), source varchar(300), doi varchar(200), url varchar(2000),
      project_id varchar(36) REFERENCES projects(id) ON DELETE RESTRICT,
      created_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
      created_at datetime NOT NULL DEFAULT (datetime('now')), updated_at datetime NOT NULL DEFAULT (datetime('now')),
      UNIQUE(id, project_id))`);
    await q.query(`CREATE TABLE product_authors (
      product_id varchar(36) NOT NULL REFERENCES academic_products(id) ON DELETE CASCADE,
      position integer NOT NULL CHECK(position > 0), user_id varchar(36) REFERENCES users(id) ON DELETE RESTRICT,
      external_name varchar(160), PRIMARY KEY(product_id, position), UNIQUE(product_id, user_id),
      CHECK((user_id IS NOT NULL AND external_name IS NULL) OR (user_id IS NULL AND external_name IS NOT NULL AND length(trim(external_name)) >= 2)))`);
    await q.query(`CREATE TABLE academic_product_results (
      product_id varchar(36) NOT NULL, result_id varchar(36) NOT NULL, project_id varchar(36) NOT NULL,
      PRIMARY KEY(product_id, result_id),
      FOREIGN KEY(product_id, project_id) REFERENCES academic_products(id, project_id) ON DELETE CASCADE,
      FOREIGN KEY(result_id, project_id) REFERENCES research_results(id, project_id) ON DELETE CASCADE)`);
    await q.query(`CREATE TABLE recognitions (
      id varchar(36) PRIMARY KEY NOT NULL, title varchar(200) NOT NULL, description text,
      recognition_date varchar(10) NOT NULL,
      user_id varchar(36) REFERENCES users(id) ON DELETE RESTRICT,
      project_id varchar(36) REFERENCES projects(id) ON DELETE RESTRICT,
      evidence_document_id varchar(36) REFERENCES documents(id) ON DELETE SET NULL,
      created_by varchar(36) REFERENCES users(id) ON DELETE SET NULL,
      created_at datetime NOT NULL DEFAULT (datetime('now')), updated_at datetime NOT NULL DEFAULT (datetime('now')),
      CHECK(user_id IS NOT NULL OR project_id IS NOT NULL))`);
    await q.query("CREATE INDEX idx_products_project ON academic_products(project_id)");
    await q.query("CREATE INDEX idx_authors_user ON product_authors(user_id)");
    await q.query("CREATE INDEX idx_recognitions_project ON recognitions(project_id)");
    await q.query("CREATE INDEX idx_recognitions_user ON recognitions(user_id)");
  }
  async down(q: QueryRunner) {
    if (!["sqlite", "better-sqlite3"].includes(q.connection.options.type)) throw new Error("Academic migration: PostgreSQL pendiente (DEC-033)");
    for (const table of ["recognitions", "academic_product_results", "product_authors", "academic_products"]) await q.query(`DROP TABLE ${table}`);
  }
}
