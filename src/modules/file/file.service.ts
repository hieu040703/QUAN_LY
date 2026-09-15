import { inject, injectable } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { FileEntity } from "@/database/models/File";
import {
  FileEntityType,
  FileCategory,
  FileStatus,
  FileType,
} from "@/database/models/File";
import { FileRepository } from "./file.repository";
import { FILE_TYPES } from "./file.types";
import logger from "@/shared/utils/logger";
import fs from "fs/promises";
import path from "path";
import { NotFoundError } from "@/shared/types/errors";
import sharp from "sharp";
import { deleteFromS3 } from "@/shared/utils/s3Helper";

/**
 * File Service - Tenant scoped
 * 3 methods chính: uploadMultiple, deleteFile, setMainFile
 * + cleanupPendingFiles cho background job
 */
@injectable()
export class FileService extends BaseService<FileEntity> {
  protected repository: FileRepository;
  protected searchableFields = ["originalName", "path", "url"];

  constructor(
    @inject(FILE_TYPES.FileRepository) private fileRepository: FileRepository,
  ) {
    super();
    this.repository = fileRepository;
  }

  async resizeAvatar(inputPath: string, outputPath: string) {
    await sharp(inputPath)
      .resize(256, 256, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }

  async generateThumbnail(inputPath: string, outputPath: string) {
    await sharp(inputPath)
      .resize(360, 360, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 82 })
      .toFile(outputPath);
  }

  /**
   * Upload multiple files
   * 1. Nhận files từ temp (upload middleware)
   * 2. Insert vào DB
   * 3. Move files vào thư mục tenant: uploads/{tenantCode}/
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    options: {
      entityId?: string;
      entityType?: FileEntityType;
      category?: FileCategory;
      isActive?: boolean;
      isPublic?: boolean;
      metadata?: Record<string, any>;
      groupId?: string;
    },
  ): Promise<FileEntity[]> {
    const { entityId, entityType, category } = options;
    const results: FileEntity[] = [];

    for (const file of files) {
      try {
        // Tạo đường dẫn đích trong thư mục tenant
        const destDir = path.join(
          process.cwd(),
          "uploads",
          entityType || "other",
          entityId || "temp",
          category || "files",
        );
        const destPath = path.join(destDir, file.filename);

        // Extract extension và type
        const extension = path.extname(file.originalname);
        const type = this.detectFileType(file.mimetype);

        const shouldGenerateThumbnail =
          type === FileType.IMAGE && category === FileCategory.IMAGE;
        const thumbnailFileName = `${path.parse(file.filename).name}_thumb.jpg`;
        const thumbnailDir = path.join(destDir, "thumb");
        const thumbnailPath = path.join(thumbnailDir, thumbnailFileName);
        const thumbnailUrl = `/uploads/${entityType || "other"}/${entityId || "temp"}/${category || "files"}/thumb/${thumbnailFileName}`;

        await fs.mkdir(destDir, { recursive: true });

        if (category === FileCategory.AVATAR) {
          await this.resizeAvatar(file.path, destPath);
          await fs.unlink(file.path);
        } else {
          await fs.rename(file.path, destPath);
        }

        if (shouldGenerateThumbnail) {
          await fs.mkdir(thumbnailDir, { recursive: true });
          await this.generateThumbnail(destPath, thumbnailPath);
        }

        // Tạo file record trong DB với status PENDING
        const fileData: Partial<FileEntity> = {
          fileName: file.filename,
          originalName: file.originalname,
          path: destPath,
          url: `/uploads/${entityType || "other"}/${entityId || "temp"}/${category || "files"}/${file.filename}`,
          storageKey: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          type,
          entityId: entityId || null,
          entityType: entityType || null,
          thumbnailPath: shouldGenerateThumbnail ? thumbnailPath : undefined,
          thumbnailUrl: shouldGenerateThumbnail ? thumbnailUrl : undefined,
          category,
          isPublic: true,
          isMain: false,
          status: options.isActive ? FileStatus.ACTIVE : FileStatus.PENDING,
        } as any;

        const dbFile = await this.create(fileData);

        results.push(dbFile);
      } catch (error) {
        logger.error(`Failed to upload file ${file.originalname}`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Delete file — Xóa trong DB trước, sau đó thử xóa trên S3.
   * Nếu S3 xóa thất bại → giữ isUploadedToS3 = true để cleanup job thử lại.
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.findById(fileId);

    if (!file) {
      throw new NotFoundError("Không tìm thấy file");
    }

    const wasUploadedToS3 = (file as any).isUploadedToS3 === true;

    // Xóa file vật lý (nếu còn local)
    try {
      if ((file as any).path) {
        await fs.unlink((file as any).path);
      }
      if ((file as any).thumbnailPath) {
        await fs.unlink((file as any).thumbnailPath);
      }
    } catch (error) {
      logger.error(
        `Failed to delete physical file ${(file as any).path}`,
        error,
      );
    }

    // Xóa trong DB (soft-delete)
    await this.delete(fileId);

    // Thử xóa trên S3 (sau khi DB đã xóa thành công)
    if (wasUploadedToS3 && file.storageKey) {
      try {
        await deleteFromS3(file.storageKey);
        if ((file as any).thumbnailStorageKey) {
          await deleteFromS3((file as any).thumbnailStorageKey).catch(() => {});
        }
        // S3 xóa thành công → cập nhật flag (optional, cleanup job cũng sẽ xử lý)
        await this.repository.getRepository().update(fileId, {
          isUploadedToS3: false,
        } as any);
      } catch (error) {
        // S3 xóa thất bại → giữ isUploadedToS3 = true để cleanup job thử lại
        logger.warn(
          `[File] S3 delete failed for ${file.storageKey}, will retry via cleanup job`,
        );
      }
    }
  }

  /**
   * Set file as main file
   * Đặt file làm main, các file khác trong cùng category thành false
   */
  async setMainFile(fileId: string): Promise<boolean> {
    const file = await this.findById(fileId);
    if (!file) {
      throw new NotFoundError("Không tìm thấy file");
    }

    if (!file.entityType || !file.entityId || !file.category) {
      throw new Error("File must have entityType, entityId, and category");
    }

    return await this.fileRepository.setMainFile(
      fileId,
      file.entityType,
      file.entityId,
      file.category,
    );
  }

  /**
   * Cleanup pending files (background job)
   * Xóa các file PENDING đã hết hạn (expiresAt < now)
   */
  async cleanupPendingFiles(): Promise<{
    deleted: number;
    failed: number;
  }> {
    const expiredFiles = await this.fileRepository.findExpiredFiles();
    let deleted = 0;
    let failed = 0;

    for (const file of expiredFiles) {
      try {
        await this.deleteFile(file.id);
        deleted++;
      } catch (error) {
        logger.error(`Failed to clean up file ${file.id}`, error);
        failed++;
      }
    }

    return { deleted, failed };
  }

  /**
   * Helper: Detect file type from MIME
   */
  private detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith("image/")) return FileType.IMAGE;
    if (mimeType.startsWith("video/")) return FileType.VIDEO;
    if (mimeType.startsWith("audio/")) return FileType.AUDIO;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("presentation") ||
      mimeType.includes("text/")
    )
      return FileType.DOCUMENT;
    return FileType.OTHER;
  }

  /**
   * DELETE /pending?entityId=xxx — Xóa tất cả file PENDING của entity.
   * Gọi khi user đóng form mà không save.
   */
  async deletePendingFilesByEntity(
    entityId: string,
  ): Promise<{ deleted: number }> {
    const pendingFiles = await this.fileRepository.find({
      where: {
        entityId,
        status: FileStatus.PENDING,
        deletedAt: undefined,
      } as any,
    });

    let deleted = 0;
    for (const file of pendingFiles) {
      try {
        await this.deleteFile(file.id);
        deleted++;
      } catch (error) {
        logger.error(`Failed to delete pending file ${file.id}`, error);
      }
    }

    return { deleted };
  }

  /**
   * Xóa các file trong __trashFileIds (gọi khi update entity thành công).
   * Chỉ xóa DB, S3 sẽ được xử lý bởi cleanup job nếu thất bại.
   */
  async deleteTrashFiles(fileIds: string[]): Promise<void> {
    for (const id of fileIds) {
      try {
        await this.deleteFile(id);
      } catch (error) {
        logger.error(`Failed to delete trash file ${id}`, error);
      }
    }
  }
}
