import { AppDataSource } from "./data-source";
import { seedRoles } from "./seeds/roles.seed";

async function main() {
  await AppDataSource.initialize();

  try {
    const roles = await seedRoles(AppDataSource);
    console.log(`Roles seeded: ${roles.created} created, ${roles.updated} updated`);
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
