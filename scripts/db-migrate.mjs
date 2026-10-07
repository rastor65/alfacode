import { config } from "dotenv";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const envFallback = path.join(root, ".env");

if (existsSync(envLocal)) {
  config({ path: envLocal });
} else if (existsSync(envFallback)) {
  config({ path: envFallback });
} else {
  config();
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Add it to .env.local first.");
  process.exit(1);
}

const migrationsDir = path.join(root, "db", "migrations");
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.log("No SQL migrations found.");
  process.exit(0);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
});

try {
  await sql.begin(async (tx) => {
    await tx`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `;

    for (const file of migrationFiles) {
      const [{ exists }] = await tx`
        select exists (
          select 1 from schema_migrations where id = ${file}
        ) as exists
      `;

      if (exists) {
        console.log(`Skipping ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const migrationSql = readFileSync(filePath, "utf8");

      console.log(`Applying ${file}`);
      await tx.unsafe(migrationSql);
      await tx`
        insert into schema_migrations (id)
        values (${file})
      `;
    }
  });

  console.log("Database migrations applied successfully.");
} catch (error) {
  console.error("Database migration failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
