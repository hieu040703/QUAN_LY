import cron from "node-cron";
import DatabaseConfig from "@/config/database";
import { FileEntity, FileStatus } from "@/database/models/File";
import { IsNull, Not } from "typeorm";
import { deleteFromS3 } from "@/shared/utils/s3Helper";
import logger from "@/shared/utils/logger";
import { config } from "@/config/env";

/**
 * Job: Xóa S3 files cho các file đã bị soft-delete nhưng chưa xóa được trên S3.
 * Chạy lúc 1h sáng mỗi ngày (Asia/Ho_Chi_Minh).
 * Chỉ thử 1 lần mỗi ngày — nếu thất bại, hôm sau thử lại.
 */
async function cleanupS3DeletedFiles() {
  try {
    const fileRepo = DatabaseConfig.getRepository(FileEntity);

    // Tìm các file đã soft-delete nhưng vẫn còn trên S3
    const files = await fileRepo.find({
      where: {
        isUploadedToS3: true,
        deletedAt: Not(IsNull()),
      } as any,
      withDeleted: true,
      take: 500,
    });

    if (files.length === 0) {
      return;
    }

    logger.info(
      `[S3Cleanup] Found ${files.length} soft-deleted files to clean up from S3`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      try {
        const storageKey = (file as any).storageKey;
        if (!storageKey) {
          // No storage key → mark as done
          await fileRepo.update(file.id, { isUploadedToS3: false } as any);
          successCount++;
          continue;
        }

        await deleteFromS3(storageKey);

        // Xóa thumbnail trên S3 nếu có
        if ((file as any).thumbnailStorageKey) {
          await deleteFromS3((file as any).thumbnailStorageKey).catch(() => {});
        }

        // S3 xóa thành công → cập nhật flag
        await fileRepo.update(file.id, { isUploadedToS3: false } as any);
        successCount++;
      } catch (error) {
        // S3 xóa thất bại → giữ nguyên flag, hôm sau thử lại
        failCount++;
        logger.warn(
          `[S3Cleanup] Failed to delete S3 file ${(file as any).storageKey}: ${error}`,
        );
      }
    }

    logger.info(
      `[S3Cleanup] Done: ${successCount} deleted, ${failCount} failed (will retry tomorrow)`,
    );
  } catch (error) {
    logger.error("[S3Cleanup] Error:", error);
  }
}

let job: ReturnType<typeof cron.schedule> | null = null;

export const S3CleanupJob = {
  start: () => {
    if (!job) {
      const cronExpression = config.S3_CLEANUP_CRON;
      job = cron.schedule(
        cronExpression,
        async () => {
          logger.info("[S3Cleanup] Starting job");
          await cleanupS3DeletedFiles();
        },
        { timezone: "Asia/Ho_Chi_Minh" },
      );
      logger.info(`[S3Cleanup] Job registered (cron: ${cronExpression})`);
    }
  },
  stop: () => {
    if (job) {
      job.stop();
      job = null;
    }
  },
};
