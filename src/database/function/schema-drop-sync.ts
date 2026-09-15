import { DatabaseConfig } from "../../config/database";

async function dropAndCreateSchema() {
  try {
    console.log("🔄 Dropping and recreating database schema...");

    await DatabaseConfig.initialize();

    // Drop tất cả tables
    await DatabaseConfig.dropDatabase();
    console.log("🗑️ Database dropped");

    // Tạo lại schema từ entities
    await DatabaseConfig.synchronize(true);
    console.log("✅ Database synchronized with entities");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

dropAndCreateSchema();
