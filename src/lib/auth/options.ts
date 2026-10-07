import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getSql } from "@/lib/db/client";

type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  roles: string[];
  permissions: string[];
};

type UserAccessRow = {
  roles: string[];
  permissions: string[];
};

async function getUserAccess(userId: string): Promise<UserAccessRow> {
  const sql = getSql();
  const rows = (await sql`
    select
      coalesce(array_agg(distinct r.key) filter (where r.key is not null), '{}') as roles,
      coalesce(array_agg(distinct p.key) filter (where p.key is not null), '{}') as permissions
    from app_users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    where u.id = ${userId}
      and u.status = 'ACTIVE'
    group by u.id
    limit 1
  `) as unknown as UserAccessRow[];

  return rows[0] ?? { roles: [], permissions: [] };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Correo y contrasena",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const sql = getSql();
        const rows = (await sql`
          select
            u.id::text,
            u.email,
            u.name,
            u.password_hash,
            coalesce(array_agg(distinct r.key) filter (where r.key is not null), '{}') as roles,
            coalesce(array_agg(distinct p.key) filter (where p.key is not null), '{}') as permissions
          from app_users u
          left join user_roles ur on ur.user_id = u.id
          left join roles r on r.id = ur.role_id
          left join role_permissions rp on rp.role_id = r.id
          left join permissions p on p.id = rp.permission_id
          where lower(u.email) = ${email}
            and u.status = 'ACTIVE'
          group by u.id
          limit 1
        `) as unknown as AuthUserRow[];

        const [user] = rows;

        if (!user?.password_hash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          roles: user.roles,
          permissions: user.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.permissions = user.permissions;
        return token;
      }

      if (token.id) {
        const access = await getUserAccess(String(token.id));
        token.roles = access.roles;
        token.permissions = access.permissions;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.roles = Array.isArray(token.roles) ? token.roles : [];
        session.user.permissions = Array.isArray(token.permissions)
          ? token.permissions
          : [];
      }

      return session;
    },
  },
};
