// Dependency Injection Types
export const FILE_TYPES = {
  FileRepository: Symbol.for("FileRepository"),
  FileService: Symbol.for("FileService"),
  FileController: Symbol.for("FileController"),
  FileRouter: Symbol.for("FileRouter"),
};

/**
 * File metadata stored in JSONB column
 */
export interface FileMetadata {
  extension: string;
  dimensions?: {
    width: number;
    height: number;
  };
  thumbnailDimensions?: {
    width: number;
    height: number;
  };
  duration?: number;
  encoding?: string;
  pages?: number;
  [key: string]: any;
}

/**
 * Storage statistics
 */
export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
  byCategory: Record<string, { count: number; size: number }>;
}

/**
 * File processing result from storage service
 */
export interface FileProcessResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  thumbnailPath?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  type: string;
  dimensions?: { width: number; height: number };
  thumbnailDimensions?: { width: number; height: number };
}
