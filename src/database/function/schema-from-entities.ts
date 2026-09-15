import { DataSource } from "typeorm";
import { DatabaseConfig } from "@/config/database";

/**
 * Tạo schema từ entities
 * Script này sẽ tạo toàn bộ database schema dựa trên các entity classes
 */
export async function createSchemaFromEntities() {
  try {
    console.log("🚀 Bắt đầu tạo schema từ entities...");

    // Khởi tạo kết nối database
    await DatabaseConfig.initialize();
    console.log("✅ Kết nối database thành công");

    // Đồng bộ hóa schema (tạo bảng từ entities)
    await DatabaseConfig.synchronize();
    console.log("✅ Schema đã được tạo thành công từ entities");

    // Đóng kết nối
    await DatabaseConfig.destroy();
    console.log("✅ Đã đóng kết nối database");
  } catch (error) {
    console.error("❌ Lỗi khi tạo schema:", error);
    process.exit(1);
  }
}

/**
 * Tạo schema và drop toàn bộ dữ liệu cũ
 * CẢNH BÁO: Sẽ xóa toàn bộ dữ liệu hiện có
 */
export async function recreateSchemaFromEntities() {
  try {
    console.log("🚀 Bắt đầu tạo lại schema từ entities (sẽ xóa dữ liệu cũ)...");

    // Khởi tạo kết nối database
    await DatabaseConfig.initialize();
    console.log("✅ Kết nối database thành công");

    // Drop schema hiện tại và tạo lại
    await DatabaseConfig.dropDatabase();
    console.log("✅ Đã xóa database cũ");

    await DatabaseConfig.synchronize();
    console.log("✅ Schema đã được tạo lại thành công từ entities");

    // Đóng kết nối
    await DatabaseConfig.destroy();
    console.log("✅ Đã đóng kết nối database");
  } catch (error) {
    console.error("❌ Lỗi khi tạo lại schema:", error);
    process.exit(1);
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--recreate")) {
    recreateSchemaFromEntities();
  } else {
    createSchemaFromEntities();
  }
}
