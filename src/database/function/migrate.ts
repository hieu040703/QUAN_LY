import { DatabaseConfig } from "../../config/database";

async function runMigration() {
  try {
    console.log("🚀 Initializing database connection...");
    await DatabaseConfig.initialize();

    console.log("📦 Running migrations...");
    await DatabaseConfig.runMigrations();

    console.log("✅ Migrations completed successfully!");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
