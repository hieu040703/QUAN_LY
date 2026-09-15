import cron from "node-cron";
import DatabaseConfig from "@/config/database";
import { FileEntity } from "@/database/models/File";
import { IsNull, Not } from "typeorm";
import { uploadToS3, getS3Url, isS3Enabled } from "@/shared/utils/s3Helper";
import logger from "@/shared/utils/logger";
import { config } from "@/config/env";
import fs from "fs/promises";

/**
 * Job: Retry upload các file & thumbnail chưa được đẩy lên S3.
 * Chạy lúc 0h mỗi ngày (Asia/Ho_Chi_Minh).
 * - Retry main file: isUploadedToS3=false, entityId not null
 * - Retry thumbnail: isUploadedToS3=true, thumbnailStorageKey is null, thumbnailPath exists
 */
async function retryS3Uploads() {
  try {
    // Nếu S3 chưa cấu hình → không có gì để retry, tránh xử lý nhầm dữ liệu
    if (!isS3Enabled()) {
      logger.info("[RetryS3Upload] S3 chưa được cấu hình, bỏ qua job");
      return;
    }

    const fileRepo = DatabaseConfig.getRepository(FileEntity);

    // 1. Files chưa upload main file lên S3
    const pendingMainFiles = await fileRepo.find({
      where: {
        isUploadedToS3: false,
        entityId: Not(IsNull()),
        deletedAt: IsNull(),
      } as any,
    });

    // 2. Files đã upload main nhưng chưa upload thumbnail
    const pendingThumbFiles = await fileRepo.find({
      where: {
        isUploadedToS3: true,
        thumbnailStorageKey: IsNull(),
        thumbnailPath: Not(IsNull()),
        entityId: Not(IsNull()),
        deletedAt: IsNull(),
      } as any,
    });

    const totalPending = pendingMainFiles.length + pendingThumbFiles.length;

    if (totalPending === 0) {
      logger.info("[RetryS3Upload] Không có file nào cần retry");
      return;
    }

    logger.info(
      `[RetryS3Upload] Tìm thấy ${pendingMainFiles.length} main files + ${pendingThumbFiles.length} thumbnails cần retry`,
    );

    let successCount = 0;
    let failCount = 0;

    // Retry main file uploads (kèm thumbnail nếu có)
    for (const file of pendingMainFiles) {
      if (!file.path) {
        // Không có local path → không upload được.
        // KHÔNG soft-delete: DB có thể dùng chung nhiều máy, file có thể đang tồn tại ở máy khác.
        logger.warn(
          `[RetryS3Upload] File ${file.id} không có local path, bỏ qua (giữ lại bản ghi)`,
        );
        failCount++;
        continue;
      }

      try {
        await fs.access(file.path);

        const s3Key = await uploadToS3({
          filePath: file.path,
          entityType: (file as any).entityType || "other",
          entityId: (file as any).entityId,
          category: file.category,
          fileName: file.fileName,
          mimeType: file.mimeType,
        });

        if (s3Key) {
          const displayUrl = getS3Url(s3Key);

          // Retry thumbnail nếu có
          let thumbnailS3Key: string | null = null;
          let thumbnailDisplayUrl: string | null = null;
          const thumbnailPath = (file as any).thumbnailPath as string | null;

          if (thumbnailPath) {
            try {
              await fs.access(thumbnailPath);
              const thumbFileName = thumbnailPath.split(/[/\\]/).pop()!;
              thumbnailS3Key = await uploadToS3({
                filePath: thumbnailPath,
                entityType: (file as any).entityType || "other",
                entityId: (file as any).entityId,
                category: `${file.category}/thumb`,
                fileName: thumbFileName,
                mimeType: "image/jpeg",
              });

              if (thumbnailS3Key) {
                thumbnailDisplayUrl = getS3Url(thumbnailS3Key);
              }
            } catch {
              // thumbnail không tồn tại → bỏ qua
            }
          }

          const updateData: any = {
            storageKey: s3Key,
            isUploadedToS3: true,
            path: null,
            url: displayUrl,
          };

          if (thumbnailS3Key) {
            updateData.thumbnailStorageKey = thumbnailS3Key;
            updateData.thumbnailUrl = thumbnailDisplayUrl;
            updateData.thumbnailPath = null;
          }

          await fileRepo.update(file.id, updateData);

          // Xóa local files sau khi upload S3 thành công
          try {
            await fs.unlink(file.path);
            if (thumbnailPath) {
              await fs.unlink(thumbnailPath).catch(() => {});
            }
          } catch (e) {
            logger.warn(
              `[RetryS3Upload] Failed to delete local file: ${file.path}`,
            );
          }

          successCount++;
        } else {
          failCount++;
        }
      } catch (err: any) {
        if (err.code === "ENOENT") {
          // File local không tồn tại trên máy này (có thể do DB dùng chung nhiều máy dev).
          // KHÔNG soft-delete bản ghi — tránh xóa nhầm dữ liệu của người khác.
          logger.warn(
            `[RetryS3Upload] File local không tồn tại: ${file.path}, bỏ qua (giữ lại bản ghi)`,
          );
          failCount++;
        } else {
          failCount++;
          logger.error(`[RetryS3Upload] Error retrying main ${file.id}:`, err);
        }
      }
    }

    // Retry thumbnail-only uploads
    for (const file of pendingThumbFiles) {
      const thumbnailPath = (file as any).thumbnailPath as string | null;
      if (!thumbnailPath) {
        failCount++;
        continue;
      }

      try {
        await fs.access(thumbnailPath);

        const thumbFileName = thumbnailPath.split(/[/\\]/).pop()!;
        const thumbnailS3Key = await uploadToS3({
          filePath: thumbnailPath,
          entityType: (file as any).entityType || "other",
          entityId: (file as any).entityId,
          category: `${file.category}/thumb`,
          fileName: thumbFileName,
          mimeType: "image/jpeg",
        });

        if (thumbnailS3Key) {
          const thumbnailDisplayUrl = getS3Url(thumbnailS3Key);

          await fileRepo.update(file.id, {
            thumbnailStorageKey: thumbnailS3Key,
            thumbnailUrl: thumbnailDisplayUrl,
            thumbnailPath: null,
          } as any);

          // Xóa local thumbnail
          try {
            await fs.unlink(thumbnailPath);
          } catch {}

          successCount++;
        } else {
          failCount++;
        }
      } catch (err: any) {
        if (err.code === "ENOENT") {
          // File local đã bị xóa → clear thumbnailPath để không retry nữa
          await fileRepo
            .update(file.id, { thumbnailPath: null } as any)
            .catch(() => {});
          failCount++;
        } else {
          failCount++;
          logger.error(
            `[RetryS3Upload] Error retrying thumbnail ${file.id}:`,
            err,
          );
        }
      }
    }

    logger.info(
      `[RetryS3Upload] Hoàn thành: ${successCount} thành công, ${failCount} thất bại`,
    );
  } catch (error) {
    logger.error("[RetryS3Upload] Lỗi:", error);
  }
}

let job: ReturnType<typeof cron.schedule> | null = null;

export const RetryS3UploadJob = {
  start: () => {
    if (!job) {
      const cronExpression = config.S3_UPLOAD_CRON;
      job = cron.schedule(
        cronExpression,
        async () => {
          logger.info("[RetryS3Upload] Bắt đầu chạy job");
          await retryS3Uploads();
        },
        { timezone: "Asia/Ho_Chi_Minh" },
      );
      logger.info(
        `[RetryS3Upload] Job đã được khởi động (cron: ${cronExpression})`,
      );
    }
  },
  stop: () => {
    if (job) {
      job.stop();
      job = null;
    }
  },
};
