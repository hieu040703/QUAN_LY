// ============================================================
// File Enums & Entity
// ============================================================

import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { FileCategory, FileEntityType, FileStatus, FileType } from "@/shared/constants/enum";

// Re-export for backward compatibility
export { FileCategory, FileEntityType, FileStatus, FileType };

@Index("IDX_files_entity", ["entityType", "entityId"])
@Index("IDX_files_category", ["category"])
@Index("IDX_files_status", ["status"])
@Entity("files")
export class FileEntity extends BaseEntity {
  @Column({ type: "uuid", nullable: true, default: null })
  storeId?: string | null;

  @Column({ type: "varchar", length: 255 })
  fileName: string;

  @Column({ type: "varchar", length: 255 })
  originalName: string;

  @Column({ type: "varchar", length: 500 })
  url: string;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  path?: string | null;

  @Column({ type: "varchar", length: 500 })
  storageKey: string;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  thumbnailPath?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  thumbnailStorageKey?: string | null;

  @Column({ type: "varchar", length: 100 })
  mimeType: string;

  @Column({ type: "int" })
  size: number;

  @Column({ type: "varchar", length: 20 })
  type: FileType;

  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  entityType?: FileEntityType | null;

  @Column({ type: "uuid", nullable: true, default: null })
  entityId?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true, default: null })
  thumbnailUrl?: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ type: "varchar", length: 20 })
  category: FileCategory;

  @Column({ type: "boolean", default: true })
  isPublic: boolean;

  @Column({ type: "boolean", default: false })
  isMain: boolean;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  alt?: string | null;

  @Column({ type: "varchar", length: 10, default: FileStatus.ACTIVE })
  status: FileStatus;

  @Column({ type: "int", default: 0 })
  downloadCount: number;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt?: Date | null;

  @Column({ type: "boolean", default: false })
  isUploadedToS3: boolean;
}
