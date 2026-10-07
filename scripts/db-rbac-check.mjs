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

try {
  const modules = await sql`
    select module, count(*)::int as permissions
    from permissions
    group by module
    order by module
  `;

  const roles = await sql`
    select
      r.key,
      r.name,
      count(rp.permission_id)::int as permissions
    from roles r
    left join role_permissions rp on rp.role_id = r.id
    group by r.id
    order by r.key
  `;

  console.log("RBAC resources:");
  for (const row of modules) {
    console.log(`${row.module}: ${row.permissions}`);
  }

  console.log("");
  console.log("Role permission assignments:");
  for (const row of roles) {
    console.log(`${row.key} (${row.name}): ${row.permissions}`);
  }
} catch (error) {
  console.error("RBAC check failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
