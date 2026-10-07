import { getSql } from "@/lib/db/client";

export type ManagedRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

export type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  roles: ManagedRole[];
  permissionsCount: number;
};

type ManagedUserRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
  roles: ManagedRole[];
  permissions_count: number;
};

export async function getManagedUsers(): Promise<ManagedUser[]> {
  const sql = getSql();
  const rows = (await sql`
    select
      u.id::text,
      u.email,
      u.name,
      u.status,
      u.created_at::text,
      coalesce(
        jsonb_agg(distinct jsonb_build_object(
          'id', r.id::text,
          'key', r.key,
          'name', r.name,
          'description', r.description
        )) filter (where r.id is not null),
        '[]'::jsonb
      ) as roles,
      count(distinct p.id)::int as permissions_count
    from app_users u
    left join user_roles ur on ur.user_id = u.id
    left join roles r on r.id = ur.role_id
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    group by u.id
    order by u.created_at desc
  `) as unknown as ManagedUserRow[];

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    roles: row.roles ?? [],
    permissionsCount: row.permissions_count,
  }));
}

export async function getManagedRoles(): Promise<ManagedRole[]> {
  const sql = getSql();
  const rows = (await sql`
    select id::text, key, name, description
    from roles
    order by key
  `) as unknown as ManagedRole[];

  return rows;
}

export async function assignRoleToUser(userId: string, roleId: string) {
  const sql = getSql();
  await sql`
    insert into user_roles (user_id, role_id)
    values (${userId}, ${roleId})
    on conflict do nothing
  `;
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const sql = getSql();
  await sql`
    delete from user_roles
    where user_id = ${userId}
      and role_id = ${roleId}
  `;
}

export async function updateUserStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
  const sql = getSql();
  await sql`
    update app_users
    set status = ${status}, updated_at = now()
    where id = ${userId}
  `;
}
