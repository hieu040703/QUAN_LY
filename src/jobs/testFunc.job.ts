import { container } from "@/config/container";
import DatabaseConfig from "@/config/database";
import logger from "@/shared/utils/logger";

// Chạy các hàm tính lại dữ liệu mỗi 0h hàng ngày
export const TestFunctionJob = {
  start: async () => {
    const occurredAt = new Date("2026-01-15T00:00:00.000Z");
    logger.info(
      `[TestFunctionJob] Bắt đầu chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );
    await DatabaseConfig.transaction(async (manager) => {
      try {
      } catch (error) {
        logger.error(
          `[TestFunctionJob] Lỗi khi chạy hàm tính lại từ ngày ${occurredAt.toISOString()}: ${error}`,
        );
        throw error;
      }
    });
    logger.info(
      `[TestFunctionJob] Hoàn thành chạy hàm tính lại từ ngày ${occurredAt.toISOString()}`,
    );
  },

  stop: () => {},
};
