import type { DataSource } from "typeorm";

import { INSTITUTIONAL_ROLES, Role } from "../../modules/roles/role.entity";

/**
 * Inserta los roles institucionales fijos. Es idempotente: no duplica roles ni
 * cambia su id (las asignaciones en user_roles dependen de el), solo corrige el nombre visible.
 */
export async function seedRoles(dataSource: DataSource) {
  const repository = dataSource.getRepository(Role);
  let created = 0;
  let updated = 0;

  for (const definition of INSTITUTIONAL_ROLES) {
    const existing = await repository.findOne({ where: { code: definition.code } });

    if (!existing) {
      await repository.save(repository.create({ code: definition.code, name: definition.name }));
      created += 1;
      continue;
    }

    if (existing.name !== definition.name) {
      await repository.update({ id: existing.id }, { name: definition.name });
      updated += 1;
    }
  }

  return { created, updated };
}
