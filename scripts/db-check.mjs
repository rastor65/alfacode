import { config } from "dotenv";
import { existsSync } from "node:fs";
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Add it to .env.local first.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: "require",
});

const tables = [
  "roles",
  "permissions",
  "research_lines",
  "technologies",
  "projects",
  "project_research_lines",
  "project_technologies",
  "site_settings",
];

try {
  for (const table of tables) {
    const [result] = await sql.unsafe(`select count(*)::int as count from ${table}`);
    console.log(`${table}: ${result.count}`);
  }
} catch (error) {
  console.error("Database check failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
