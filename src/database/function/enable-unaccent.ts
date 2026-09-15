import { DatabaseConfig } from "@/config/database";

async function enableUnaccent() {
  try {
    console.log("🚀 Initializing database connection...");
    await DatabaseConfig.initialize();

    console.log("📦 Enabling unaccent extension...");
    await DatabaseConfig.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);

    console.log("✅ Unaccent extension enabled successfully!");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to enable unaccent:", error);
    process.exit(1);
  }
}

enableUnaccent();
