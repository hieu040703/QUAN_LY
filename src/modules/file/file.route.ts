import { Router } from "express";
import { injectable, inject } from "inversify";
import { FileController } from "./file.controller";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { FileParamsSchema, UploadSchema } from "./file.validator";
import multer from "multer";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { FILE_TYPES } from "./file.types";
import crypto from "crypto";
import path from "path";
import fs from "fs";

// Multer upload config (temp storage with extension preserved)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destDir = "uploads/temp/";
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with extension
    const extension = path.extname(file.originalname);
    const uniqueName = crypto.randomBytes(16).toString("hex");
    cb(null, `${uniqueName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/**
 * File Routes - 3 endpoints tinh gọn
 * POST /       - Upload multiple files
 * DELETE /:id  - Delete file
 * POST /:id/set-main - Set main file
 */
@injectable()
export class FileRouter {
  public router: Router;

  constructor(
    @inject(FILE_TYPES.FileController) private fileController: FileController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All routes require authentication
    this.router.use(authenticate);

    // Upload multiple files
    this.router.post(
      "/",
      upload.array("files", 10) as any, // Max 10 files
      zodValidate(UploadSchema, "body"),
      this.fileController.uploadMultiple,
    );

    // Set main file
    this.router.post(
      "/:id/set-main",
      zodValidate(FileParamsSchema, "params"),
      this.fileController.setMainFile,
    );

    // Delete pending files by entityId (must be BEFORE /:id route)
    this.router.delete("/pending", this.fileController.deletePendingByEntity);

    // Delete file
    this.router.delete(
      "/:id",
      zodValidate(FileParamsSchema, "params"),
      this.fileController.deleteOne,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
