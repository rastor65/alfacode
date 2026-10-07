import bcrypt from "bcryptjs";
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

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Administrador AlfaCode";

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Add it to .env.local first.");
  process.exit(1);
}

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env.local.");
  process.exit(1);
}

if (password.length < 10) {
  console.error("ADMIN_PASSWORD must be at least 10 characters long.");
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: "require",
});

try {
  const passwordHash = await bcrypt.hash(password, 12);

  await sql.begin(async (tx) => {
    const [user] = await tx`
      insert into app_users (email, name, password_hash, email_verified_at, status)
      values (${email.toLowerCase()}, ${name}, ${passwordHash}, now(), 'ACTIVE')
      on conflict (email) do update set
        name = excluded.name,
        password_hash = excluded.password_hash,
        status = 'ACTIVE',
        updated_at = now()
      returning id, email
    `;

    await tx`
      insert into profiles (id, display_name, email, status)
      values (${user.id}, ${name}, ${email.toLowerCase()}, 'ACTIVE')
      on conflict (id) do update set
        display_name = excluded.display_name,
        email = excluded.email,
        status = excluded.status,
        updated_at = now()
    `;

    const [adminRole] = await tx`
      select id from roles where key = 'administrador'
    `;

    if (!adminRole) {
      throw new Error("Role administrador not found. Run npm run db:seed first.");
    }

    await tx`
      insert into user_roles (user_id, role_id)
      values (${user.id}, ${adminRole.id})
      on conflict do nothing
    `;
  });

  console.log(`Admin user ready: ${email.toLowerCase()}`);
} catch (error) {
  console.error("Admin user creation failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
