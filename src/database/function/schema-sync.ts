import { DatabaseConfig } from "../../config/database";

async function syncSchema() {
  try {
    console.log("🔄 Synchronizing database schema without data loss...");

    await DatabaseConfig.initialize();

    // CREATE EXTENSION IF NOT EXISTS unaccent;
    // Cài thêm extension unaccent nếu chưa có để hỗ trợ tìm kiếm không dấu
    await DatabaseConfig.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`);
    console.log("✅ Extension 'unaccent' ensured");

    // Đồng bộ schema mà không xóa dữ liệu
    // synchronize(false) sẽ:
    // - Tạo bảng mới nếu chưa có
    // - Thêm cột mới nếu thiếu
    // - Cập nhật index, constraint
    // - KHÔNG xóa bảng hoặc dữ liệu hiện có
    await DatabaseConfig.synchronize(false);
    console.log("✅ Database schema synchronized (data preserved)");

    await DatabaseConfig.destroy();
    console.log("🔒 Database connection closed");
  } catch (error) {
    console.error("❌ Schema synchronization error:", error);
    process.exit(1);
  }
}

syncSchema();
