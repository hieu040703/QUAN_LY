import { DatabaseConfig } from "../../config/database";

async function dropSchema() {
  try {
    console.log("🔄 Dropping database schema...");

    await DatabaseConfig.initialize();
    console.log("🔗 Database connected");

    // Drop custom enum types first (PostgreSQL specific)
    const queryRunner = DatabaseConfig.createQueryRunner();
    try {
      await queryRunner.query(
        `DROP TYPE IF EXISTS "public"."attributes_type_enum" CASCADE;`,
      );
      console.log("🗑️ Dropped existing enum types");
    } catch (error) {
      console.log("ℹ️  No existing enum types to drop");
    } finally {
      await queryRunner.release();
    }

    // Drop tất cả tables
    await DatabaseConfig.dropDatabase();
    console.log("🗑️ Database schema dropped successfully");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed");
  } catch (error) {
    console.error("❌ Error dropping schema:", error);
    process.exit(1);
  }
}

dropSchema();
