import { FindOptionsSelect, FindOptionsRelations } from "typeorm";
import { FileEntity } from "@/database/models/File";

/**
 * Basic fields for list view
 */
export const FileSelectBasic: FindOptionsSelect<FileEntity> = {
  id: true,
  fileName: true,
  originalName: true,
  url: true,
  thumbnailUrl: true,
  size: true,
  type: true,
  entityType: true,
  entityId: true,
  category: true,
  isMain: true,
  status: true,
  createdAt: true,
};

/**
 * Full fields for detail view
 */
export const FileSelectFull: FindOptionsSelect<FileEntity> = {
  ...FileSelectBasic,
  path: true,
  thumbnailPath: true,
  isPublic: true,
  alt: true,
  updatedAt: true,
  deletedAt: true,
};

/**
 * Relations (File has no relations)
 */
export const FileRelations: FindOptionsRelations<FileEntity> = {};
