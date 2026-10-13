import "reflect-metadata";

import { DataSource } from "typeorm";

import { entities, migrations } from "./database.options";

/** SQLite en memoria con las migraciones reales, para pruebas aisladas. */
export async function createTestDataSource() {
  const dataSource = new DataSource({
    type: "better-sqlite3",
    database: ":memory:",
    entities,
    migrations,
    synchronize: false,
  });

  await dataSource.initialize();
  await dataSource.runMigrations({ transaction: "all" });

  return dataSource;
}
