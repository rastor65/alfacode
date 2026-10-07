import { getSql } from "@/lib/db/client";

export type PermissionRecord = {
  id: string;
  key: string;
  module: string;
  description: string | null;
};

export type RoleWithPermissions = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: PermissionRecord[];
};

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: PermissionRecord[];
};

export async function getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const sql = getSql();
  const rows = (await sql`
    select
      r.id::text,
      r.key,
      r.name,
      r.description,
      coalesce(
        jsonb_agg(distinct jsonb_build_object(
          'id', p.id::text,
          'key', p.key,
          'module', p.module,
          'description', p.description
        )) filter (where p.id is not null),
        '[]'::jsonb
      ) as permissions
    from roles r
    left join role_permissions rp on rp.role_id = r.id
    left join permissions p on p.id = rp.permission_id
    group by r.id
    order by r.key
  `) as unknown as RoleRow[];

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    permissions: row.permissions ?? [],
  }));
}

export async function getPermissionsGroupedByModule() {
  const sql = getSql();
  const permissions = (await sql`
    select id::text, key, module, description
    from permissions
    order by module, key
  `) as unknown as PermissionRecord[];

  return permissions.reduce<Record<string, PermissionRecord[]>>((groups, permission) => {
    groups[permission.module] ??= [];
    groups[permission.module].push(permission);
    return groups;
  }, {});
}
