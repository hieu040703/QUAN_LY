import { inject, injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { BaseController } from "@/shared/base/BaseController";
import { FileEntity } from "@/database/models/File";
import { FileService } from "./file.service";
import { FILE_TYPES } from "./file.types";
import {
  asyncHandler,
  sendError,
  sendResponse,
} from "@/shared/utils/controller.utils";
import logger from "@/shared/utils/logger";
import { UploadDto } from "./file.validator";

/**
 * File Controller - Tenant scoped
 * 3 endpoints: upload multiple, delete, set main
 */
@injectable()
export class FileController extends BaseController<FileEntity> {
  protected service: FileService;

  constructor(
    @inject(FILE_TYPES.FileService) private fileService: FileService,
  ) {
    super();
    this.service = fileService;
  }

  /**
   * POST /
   * Upload multiple files
   * Body (form-data): entityId?, entityType?, category?
   * Files: files[] field
   */
  uploadMultiple = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        const body: UploadDto = req.body;

        if (!files || files.length === 0) {
          throw new Error("No files uploaded");
        }

        const uploaded = await this.fileService.uploadMultiple(files, body);

        sendResponse({
          res,
          data: { files: uploaded, count: uploaded.length },
          statusCode: 201,
        });
      } catch (error) {
        logger.error("Error FileController:[uploadMultiple]:", error);
        sendError({ res, message: "Upload failed", statusCode: 400 });
      }
    },
  );

  /**
   * DELETE /:id
   * Delete file (DB + physical file)
   */
  deleteOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        await this.fileService.deleteFile(id);

        sendResponse({ res, message: "File deleted successfully" });
      } catch (error) {
        logger.error("Error FileController:[deleteOne]:", error);
        sendError({ res, message: "Delete failed", statusCode: 400 });
      }
    },
  );

  /**
   * POST /:id/set-main
   * Set file as main file
   */
  setMainFile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { id } = req.params;

        const success = await this.fileService.setMainFile(id);

        sendResponse({ res, data: { success } });
      } catch (error) {
        logger.error("Error FileController:[setMainFile]:", error);
        sendError({
          res,
          message: "Failed to set main file",
          statusCode: 400,
        });
      }
    },
  );

  /**
   * DELETE /pending?entityId={entityId}
   * Delete all pending files for an entity (called when user closes form without saving)
   */
  deletePendingByEntity = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { entityId } = req.query;

        if (!entityId || typeof entityId !== "string") {
          throw new Error("entityId query parameter is required");
        }

        const result =
          await this.fileService.deletePendingFilesByEntity(entityId);

        sendResponse({ res, data: result });
      } catch (error) {
        logger.error("Error FileController:[deletePendingByEntity]:", error);
        sendError({
          res,
          message: "Failed to delete pending files",
          statusCode: 400,
        });
      }
    },
  );
}
