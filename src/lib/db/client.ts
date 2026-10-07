import { neon } from "@neondatabase/serverless";

let sqlClient: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  sqlClient ??= neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function withAppUserContext<T>(
  userId: string | null,
  operation: () => Promise<T>,
) {
  // This is the app-level seam where future transactions should set:
  // select set_config('app.user_id', $1, true)
  // before protected queries that rely on PostgreSQL RLS.
  void userId;
  return operation();
}
