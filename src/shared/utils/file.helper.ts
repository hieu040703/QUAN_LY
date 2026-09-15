import { In, IsNull, Repository } from "typeorm";
import { FileEntity } from "@/database/models/File";
import DatabaseConfig from "@/config/database";
import { FileStatus } from "../constants/enum";

/**
 * File Helper - Utility functions để xử lý files trong services
 */
export class FileHelper {
  private static async getFileRepo(): Promise<Repository<FileEntity>> {
    return DatabaseConfig.getRepository<FileEntity>(FileEntity as any);
  }

  /**
   * Confirm files sau khi tạo entity thành công
   * Update tempEntityId -> realEntityId
   *
   * @example
   * // Trong employee.service.ts - sau khi create employee
   * await FileHelper.confirmEntityFiles(tempId, employee.id);
   */
  static async confirmEntityFiles(tempEntityId: string, realEntityId: string): Promise<number> {
    const fileRepo = await this.getFileRepo();
    const result = await fileRepo.update(
      { entityId: tempEntityId, deletedAt: IsNull() },
      {
        entityId: realEntityId,
        status: FileStatus.ACTIVE,
        expiresAt: null,
      },
    );
    return result.affected ?? 0;
  }

  /**
   * Attach files vào single entity
   * Lấy files theo entityId và gom theo category
   *
   * @example
   * // Trong employee.service.ts - findById
   * const employee = await this.findById(id);
   * return await FileHelper.attachFilesToEntity(employee);
   */
  static async attachFilesToEntity<T extends { id: string }>(
    entity: T | null,
  ): Promise<(T & Record<string, FileEntity[]>) | null> {
    if (!entity) return null;

    const grouped = await this.getEntityFiles(entity.id);
    return {
      ...entity,
      ...grouped,
    };
  }

  /**
   * Attach files vào array of entities
   * Tối ưu với 1 query cho tất cả entities
   *
   * @example
   * // Trong employee.service.ts - findAll
   * const employees = await this.findAll(options);
   * return await FileHelper.attachFilesToEntities(employees);
   */
  static async attachFilesToEntities<T extends { id: string }>(
    entities: T[],
  ): Promise<(T & Record<string, FileEntity[]>)[]> {
    if (!entities || entities.length === 0) return [];

    if (!entities || entities.length === 0) return [];

    const fileRepo = await this.getFileRepo();
    const entityIds = entities.map((e) => e.id);

    const allFiles = await fileRepo.find({
      where: {
        entityId: In(entityIds as any),
        status: FileStatus.ACTIVE,
        deletedAt: IsNull(),
      } as any,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });

    const filesByEntity: Record<string, Record<string, FileEntity[]>> = {};

    for (const file of allFiles) {
      if (!file.entityId) continue;
      if (!filesByEntity[file.entityId]) filesByEntity[file.entityId] = {};
      const category = file.category || "other";
      if (!filesByEntity[file.entityId][category]) filesByEntity[file.entityId][category] = [];
      filesByEntity[file.entityId][category].push(file);
    }

    return entities.map((entity) => {
      const entityFiles = filesByEntity[entity.id] || {};
      return {
        ...entity,
        ...entityFiles,
      };
    });
  }

  /**
   * Get files grouped by category cho 1 entity
   *
   * @example
   * const files = await FileHelper.getEntityFiles(employeeId);
   * // Returns: { avatar: [...], documents: [...] }
   */
  static async getEntityFiles(entityId: string): Promise<Record<string, FileEntity[]>> {
    const fileRepo = await this.getFileRepo();
    const files = await fileRepo.find({
      where: {
        entityId,
        status: FileStatus.ACTIVE,
        deletedAt: IsNull(),
      } as any,
      order: { isMain: "DESC", createdAt: "DESC" } as any,
    });

    const grouped: Record<string, FileEntity[]> = {};
    for (const file of files) {
      const category = file.category || "other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(file);
    }
    return grouped;
  }
}
