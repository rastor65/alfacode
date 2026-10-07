import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/app/dashboard");
  }

  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireSession();

  if (!session.user.permissions.includes(permission)) {
    redirect("/app/dashboard");
  }

  return session;
}
