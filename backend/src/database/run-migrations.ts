import { AppDataSource } from "./data-source";

async function main() {
  const command = process.argv[2] ?? "run";

  await AppDataSource.initialize();

  try {
    if (command === "run") {
      const migrations = await AppDataSource.runMigrations({ transaction: "all" });
      console.log(`Migrations executed: ${migrations.length}`);
      for (const migration of migrations) {
        console.log(`- ${migration.name}`);
      }
      return;
    }

    if (command === "revert") {
      await AppDataSource.undoLastMigration({ transaction: "all" });
      console.log("Last migration reverted");
      return;
    }

    if (command === "show") {
      const pending = await AppDataSource.showMigrations();
      console.log(`Pending migrations: ${pending}`);
      return;
    }

    throw new Error(`Unsupported migration command: ${command}`);
  } finally {
    await AppDataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
