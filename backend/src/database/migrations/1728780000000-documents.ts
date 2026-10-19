import type { MigrationInterface, QueryRunner } from "typeorm";

export class Documents1728780000000 implements MigrationInterface {
  name = "Documents1728780000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003, DEC-025); no se declara SQL sin verificar.
      throw new Error("Documents1728780000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // Destino de la clave compuesta (resultado, proyecto) de `documents`.
    await queryRunner.query("CREATE UNIQUE INDEX uq_research_results_id_project ON research_results (id, project_id)");

    // F3-05. Solo metadatos: el contenido vive en el almacenamiento, bajo `storage_key`
    // (aleatoria, nunca derivada del nombre original). La clave compuesta del resultado impide
    // vincular un documento a un resultado de otro proyecto aunque se salte la API.
    await queryRunner.query(`
      CREATE TABLE documents (
        id varchar(36) PRIMARY KEY NOT NULL,
        scope varchar(15) NOT NULL,
        project_id varchar(36) NULL,
        research_result_id varchar(36) NULL,
        title varchar(200) NOT NULL,
        description text NULL,
        category varchar(20) NOT NULL DEFAULT 'other',
        access_level varchar(12) NOT NULL DEFAULT 'restricted',
        original_name varchar(255) NOT NULL,
        extension varchar(10) NOT NULL,
        mime_type varchar(100) NOT NULL,
        size_bytes integer NOT NULL,
        sha256 varchar(64) NOT NULL,
        storage_key varchar(64) NOT NULL,
        uploaded_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_documents_storage_key UNIQUE (storage_key),
        CONSTRAINT chk_documents_scope CHECK (
          (scope = 'project' AND project_id IS NOT NULL)
          OR (scope = 'institutional' AND project_id IS NULL AND research_result_id IS NULL)
        ),
        CONSTRAINT chk_documents_category CHECK (category IN (
          'minutes', 'report', 'certificate', 'evidence', 'project', 'academic', 'administrative', 'other'
        )),
        CONSTRAINT chk_documents_access_level CHECK (access_level IN ('general', 'restricted', 'private')),
        CONSTRAINT chk_documents_size CHECK (size_bytes > 0),
        CONSTRAINT fk_documents_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        -- Sin accion al borrar: SQLite anularia tambien project_id. El servicio desvincula los
        -- documentos antes de eliminar un resultado.
        CONSTRAINT fk_documents_result FOREIGN KEY (research_result_id, project_id) REFERENCES research_results (id, project_id),
        CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_documents_project ON documents (project_id)");
    await queryRunner.query("CREATE INDEX idx_documents_result ON documents (research_result_id)");
    await queryRunner.query("CREATE INDEX idx_documents_scope_access ON documents (scope, access_level)");

    // F3-08. Personas autorizadas expresamente a un documento privado.
    await queryRunner.query(`
      CREATE TABLE document_grants (
        document_id varchar(36) NOT NULL,
        user_id varchar(36) NOT NULL,
        granted_by varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (document_id, user_id),
        CONSTRAINT fk_document_grants_document FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
        CONSTRAINT fk_document_grants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_document_grants_granted_by FOREIGN KEY (granted_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_document_grants_user ON document_grants (user_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS document_grants");
    await queryRunner.query("DROP TABLE IF EXISTS documents");
    await queryRunner.query("DROP INDEX IF EXISTS uq_research_results_id_project");
  }
}
