import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import { config } from "@/config/env";
import { DatabaseConfig } from "@/config/database";
import { LessThan } from "typeorm";
import logger from "@/shared/utils/logger";

/**
 * Xóa physical files đã bị soft-delete quá FILE_RETENTION_DAYS ngày
 */
async function cleanupDeletedFiles() {
  const retentionDays = config.FILE_RETENTION_DAYS;

  try {
    const fileRepo = DatabaseConfig.getRepository("FileEntity");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Tìm files có deletedAt < cutoffDate
    const expiredFiles = await fileRepo.find({
      where: {
        deletedAt: LessThan(cutoffDate),
      } as any,
      withDeleted: true,
    });

    if (expiredFiles.length === 0) {
      logger.info("[CleanupFiles] Không có file nào cần dọn dẹp.");
      return;
    }

    logger.info(`[CleanupFiles] Tìm thấy ${expiredFiles.length} file cần xóa vật lý.`);

    let deletedCount = 0;
    let failedCount = 0;

    for (const file of expiredFiles) {
      try {
        const fileAny = file as any;

        // Xóa file chính
        if (fileAny.path) {
          await fs.unlink(fileAny.path).catch(() => {});
        }

        // Xóa thumbnail
        if (fileAny.thumbnailPath) {
          await fs.unlink(fileAny.thumbnailPath).catch(() => {});
        }

        // Xóa bản ghi DB (hard delete)
        await fileRepo.delete({ id: fileAny.id } as any);

        deletedCount++;

        // Dọn thư mục rỗng sau khi xóa file
        if (fileAny.path) {
          const dir = path.dirname(fileAny.path);
          try {
            const files = await fs.readdir(dir);
            if (files.length === 0) {
              await fs.rmdir(dir).catch(() => {});
            }
          } catch {
            // Thư mục không tồn tại hoặc không thể đọc
          }
        }
      } catch (err) {
        failedCount++;
        logger.error(`[CleanupFiles] Lỗi xóa file ${(file as any).id}:`, err);
      }
    }

    logger.info(`[CleanupFiles] Hoàn tất: ${deletedCount} file đã xóa, ${failedCount} lỗi.`);
  } catch (error) {
    logger.error("[CleanupFiles] Lỗi cron job:", error);
  }
}

let job: ReturnType<typeof cron.schedule> | null = null;

export const CleanupFilesJob = {
  start: () => {
    if (!job) {
      // node-cron v4: schedule(expression, options, callback)
      job = cron.schedule(
        "0 0 0 * * *", // 0h mỗi ngày

        async () => {
          logger.info(`[CleanupFiles] Bắt đầu chạy job (retention=${config.FILE_RETENTION_DAYS} ngày)`);
          await cleanupDeletedFiles();
        },
        { timezone: "Asia/Ho_Chi_Minh" },
      );
      logger.info(`[CleanupFiles] Job đã được khởi động (retention=${config.FILE_RETENTION_DAYS} ngày)`);
    }
  },

  stop: () => {
    if (job) {
      job.stop();
      job = null;
      logger.info("[CleanupFiles] Job đã dừng");
    }
  },
};
