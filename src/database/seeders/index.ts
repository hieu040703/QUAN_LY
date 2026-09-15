import "reflect-metadata";
import { DatabaseSeeder } from "./DatabaseSeeder";

async function runSeeders() {
  try {
    await DatabaseSeeder.run();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

runSeeders();
