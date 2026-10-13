import type { MigrationInterface, QueryRunner } from "typeorm";

export class IdentityFlows1728710000000 implements MigrationInterface {
  name = "IdentityFlows1728710000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("IdentityFlows1728710000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    // Hash del token CSRF ligado a la sesion. Nulo solo para sesiones previas a esta migracion,
    // que no pueden ejecutar operaciones mutables.
    await queryRunner.query("ALTER TABLE sessions ADD COLUMN csrf_token_hash varchar(64) NULL");

    await queryRunner.query(`
      CREATE TABLE membership_requests (
        id varchar(36) PRIMARY KEY NOT NULL,
        user_id varchar(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        message text NULL,
        approved_role_id varchar(36) NULL,
        reviewed_by varchar(36) NULL,
        reviewed_at datetime NULL,
        review_comment text NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT chk_membership_requests_status CHECK (status IN ('pending', 'approved', 'rejected')),
        CONSTRAINT fk_membership_requests_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_membership_requests_role FOREIGN KEY (approved_role_id) REFERENCES roles (id) ON DELETE RESTRICT,
        CONSTRAINT fk_membership_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_membership_requests_status ON membership_requests (status)");
    // Una sola solicitud pendiente por usuario.
    await queryRunner.query(
      "CREATE UNIQUE INDEX uq_membership_requests_pending_user ON membership_requests (user_id) WHERE status = 'pending'",
    );

    await queryRunner.query(`
      CREATE TABLE invitations (
        id varchar(36) PRIMARY KEY NOT NULL,
        email_normalized varchar(254) NOT NULL,
        role_id varchar(36) NOT NULL,
        token_hash varchar(64) NOT NULL,
        invited_by varchar(36) NULL,
        expires_at datetime NOT NULL,
        accepted_at datetime NULL,
        accepted_user_id varchar(36) NULL,
        revoked_at datetime NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_invitations_token_hash UNIQUE (token_hash),
        CONSTRAINT fk_invitations_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
        CONSTRAINT fk_invitations_inviter FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL,
        CONSTRAINT fk_invitations_accepted_user FOREIGN KEY (accepted_user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query("CREATE INDEX idx_invitations_email_normalized ON invitations (email_normalized)");

    await queryRunner.query(`
      CREATE TABLE verification_tokens (
        id varchar(36) PRIMARY KEY NOT NULL,
        user_id varchar(36) NOT NULL,
        purpose varchar(30) NOT NULL,
        token_hash varchar(64) NOT NULL,
        expires_at datetime NOT NULL,
        used_at datetime NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_verification_tokens_token_hash UNIQUE (token_hash),
        CONSTRAINT chk_verification_tokens_purpose CHECK (purpose IN ('email_verification', 'password_reset')),
        CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query("CREATE INDEX idx_verification_tokens_user_id ON verification_tokens (user_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS verification_tokens");
    await queryRunner.query("DROP TABLE IF EXISTS invitations");
    await queryRunner.query("DROP TABLE IF EXISTS membership_requests");
    await queryRunner.query("ALTER TABLE sessions DROP COLUMN csrf_token_hash");
  }
}
