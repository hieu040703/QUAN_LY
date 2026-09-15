import { config } from "@/config/env";
import { DatabaseConfig } from "../../config/database";

async function checkSyncStatus() {
  try {
    console.log("🔍 Checking database sync status...");

    await DatabaseConfig.initialize();

    // Kiểm tra có pending migrations không
    const hasPendingMigrations = await DatabaseConfig.showMigrations();
    if (hasPendingMigrations) {
      console.log("⚠️ Pending migrations found");
    } else {
      console.log("✅ No pending migrations");
    }

    // Kiểm tra schema sync (development only)
    if (config.NODE_ENV === "development") {
      const sqlInMemory = await DatabaseConfig.driver
        .createSchemaBuilder()
        .log();
      if (sqlInMemory.upQueries.length > 0) {
        console.log("⚠️ Schema changes detected:");
        sqlInMemory.upQueries.forEach((query) => {
          console.log(`   - ${query.query}`);
        });
      } else {
        console.log("✅ Database schema is in sync with entities");
      }
    }

    await DatabaseConfig.destroy();
  } catch (error) {
    console.error("❌ Error checking sync status:", error);
    process.exit(1);
  }
}

checkSyncStatus();
