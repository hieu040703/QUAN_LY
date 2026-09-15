import { injectable } from "inversify";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { FileEntity } from "@/database/models/File";
import { FileEntityType, FileCategory, FileStatus, FileType } from "@/database/models/File";
import { FileSelectFull, FileRelations } from "./file.select";
import { Brackets, In, IsNull, LessThan, SelectQueryBuilder } from "typeorm";
import { StorageStats } from "./file.types";

/**
 * File Repository - Tenant scoped
 */
@injectable()
export class FileRepository extends BaseRepository<FileEntity> {
  protected entityClass = FileEntity;
  protected selectedFields = FileSelectFull;
  protected relations = FileRelations;

  // Set main file (đặt isMain=true, còn lại=false)
  async setMainFile(
    fileId: string,
    entityType: FileEntityType,
    entityId: string,
    category: FileCategory,
  ): Promise<boolean> {
    const repo = this.getRepository();

    await repo.update({ entityType, entityId, category, deletedAt: IsNull() } as any, { isMain: false });

    const result = await repo.update(fileId, { isMain: true });
    return (result.affected ?? 0) > 0;
  }

  // Batch update entityId (confirm flow - tempId → realId)
  async batchUpdateEntityId(tempEntityId: string, realEntityId: string): Promise<number> {
    const repo = this.getRepository();

    const result = await repo.update({ entityId: tempEntityId, deletedAt: IsNull() } as any, {
      entityId: realEntityId,
      status: FileStatus.ACTIVE,
    });

    return result.affected ?? 0;
  }

  // Find expired files
  async findExpiredFiles(): Promise<FileEntity[]> {
    const repo = this.getRepository();
    return repo.find({
      where: { expiresAt: LessThan(new Date()), deletedAt: IsNull() } as any,
    });
  }

  // Find files by entity
  async findByEntity(
    entityId: string,
    options?: {
      category?: FileCategory;
      status?: FileStatus;
      includeDeleted?: boolean;
    },
  ): Promise<FileEntity[]> {
    const repo = this.getRepository();
    const where: any = { entityId };

    if (options?.category) where.category = options.category;
    if (options?.status) where.status = options.status;
    if (!options?.includeDeleted) where.deletedAt = IsNull();

    return repo.find({
      where,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });
  }

  // Find files by multiple entities (batch — tránh N+1)
  async findByEntityIds(
    entityIds: string[],
    options?: {
      category?: FileCategory;
      status?: FileStatus;
      includeDeleted?: boolean;
    },
  ): Promise<FileEntity[]> {
    if (!entityIds.length) return [];

    const repo = this.getRepository();
    const where: any = { entityId: In(entityIds) };

    if (options?.category) where.category = options.category;
    if (options?.status) where.status = options.status;
    if (!options?.includeDeleted) where.deletedAt = IsNull();

    return repo.find({
      where,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<StorageStats> {
    const repo = this.getRepository();

    const [files, total] = await repo.findAndCount({
      where: { deletedAt: IsNull() } as any,
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const byType: Record<string, { count: number; size: number }> = {};
    const byCategory: Record<string, { count: number; size: number }> = {};

    files.forEach((file) => {
      if (!byType[file.type]) byType[file.type] = { count: 0, size: 0 };
      byType[file.type].count++;
      byType[file.type].size += file.size;

      if (file.category) {
        if (!byCategory[file.category]) byCategory[file.category] = { count: 0, size: 0 };
        byCategory[file.category].count++;
        byCategory[file.category].size += file.size;
      }
    });

    return {
      totalFiles: total,
      totalSize,
      byType,
      byCategory,
    };
  }

  async findFilesMissingThumbnail(limit = 200): Promise<FileEntity[]> {
    const repo = this.getRepository();

    return repo
      .createQueryBuilder("file")
      .where("file.deletedAt IS NULL")
      .andWhere("file.type = :type", { type: FileType.IMAGE })
      .andWhere("file.category = :category", {
        category: FileCategory.IMAGE,
      })
      .andWhere("file.path IS NOT NULL")
      .andWhere(
        new Brackets((qb) => {
          qb.where("file.thumbnailPath IS NULL").orWhere("file.thumbnailUrl IS NULL");
        }),
      )
      .orderBy("file.createdAt", "ASC")
      .limit(limit)
      .getMany();
  }

  async updateThumbnailInfo(fileId: string, thumbnailPath: string, thumbnailUrl: string): Promise<void> {
    const repo = this.getRepository();
    await repo.update({ id: fileId, deletedAt: IsNull() } as any, {
      thumbnailPath,
      thumbnailUrl,
    });
  }
}
