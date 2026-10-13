import type { MigrationInterface, QueryRunner } from "typeorm";

export class IdentityBase1728700000000 implements MigrationInterface {
  name = "IdentityBase1728700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const type = queryRunner.connection.options.type;

    if (type === "postgres") {
      // PostgreSQL esta pausado (DEC-003); no se declara SQL sin verificar.
      throw new Error("IdentityBase1728700000000 is not implemented for postgres yet (DEC-003)");
    }

    if (type !== "better-sqlite3" && type !== "sqlite") {
      throw new Error(`Unsupported migration database type: ${type}`);
    }

    await queryRunner.query(`
      CREATE TABLE users (
        id varchar(36) PRIMARY KEY NOT NULL,
        full_name varchar(160) NOT NULL,
        email_normalized varchar(254) NOT NULL,
        password_hash varchar(255) NOT NULL,
        account_status varchar(20) NOT NULL DEFAULT 'pending',
        email_verified_at datetime NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        updated_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_users_email_normalized UNIQUE (email_normalized),
        CONSTRAINT chk_users_account_status
          CHECK (account_status IN ('pending', 'active', 'inactive', 'rejected'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE roles (
        id varchar(36) PRIMARY KEY NOT NULL,
        code varchar(40) NOT NULL,
        name varchar(80) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT uq_roles_code UNIQUE (code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id varchar(36) NOT NULL,
        role_id varchar(36) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT
      )
    `);
    await queryRunner.query("CREATE INDEX idx_user_roles_role_id ON user_roles (role_id)");

    await queryRunner.query(`
      CREATE TABLE sessions (
        id varchar(36) PRIMARY KEY NOT NULL,
        user_id varchar(36) NOT NULL,
        token_hash varchar(64) NOT NULL,
        created_at datetime NOT NULL DEFAULT (datetime('now')),
        expires_at datetime NOT NULL,
        revoked_at datetime NULL,
        CONSTRAINT uq_sessions_token_hash UNIQUE (token_hash),
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query("CREATE INDEX idx_sessions_user_id ON sessions (user_id)");
    await queryRunner.query("CREATE INDEX idx_sessions_expires_at ON sessions (expires_at)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS sessions");
    await queryRunner.query("DROP TABLE IF EXISTS user_roles");
    await queryRunner.query("DROP TABLE IF EXISTS roles");
    await queryRunner.query("DROP TABLE IF EXISTS users");
  }
}
