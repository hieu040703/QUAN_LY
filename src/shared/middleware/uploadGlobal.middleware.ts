import fs from "fs";
import path from "path";
import multer from "multer";
import { Request, Response, NextFunction } from "express";

export class UploadGlobalMiddleware {
  public static uploadFiles = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      let folderPath = "uploads/temp";

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, folderPath);
        },
        filename: (req, file, cb) => {
          const fileNameWithoutExtname = file.originalname
            .split(".")
            .slice(0, -1)
            .join(".")
            .normalize("NFKD") // Chuẩn hóa Unicode
            .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
            .replace(/\s+/g, "-"); // Thay space bằng dấu gạch;
          const uniqueSuffix = `${fileNameWithoutExtname}-${Date.now()}${path
            .extname(file.originalname)
            .toUpperCase()}`;
          cb(null, uniqueSuffix);
        },
      });

      const upload = multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 },
      }).any();

      upload(req as any, res as any, async (err) => {
        if (err) {
          console.log("Upload Error:", err);
          return next(err);
        }

        console.log("Upload Success:", req.body);

        const files = req.files as Express.Multer.File[];
        let keys = req.body.keys;

        console.log("keys", keys);

        if (!Array.isArray(keys)) {
          keys = keys ? [keys] : [];
        }

        if (files.length !== keys.length) {
          console.log("Số lượng file không khớp với số keys!");
          return next(err);
        }

        try {
          let uploadedUrls: Record<string, string> = {};

          files.forEach((file, index) => {
            const fileUrl = file.path.replace(/\\/g, "/");
            uploadedUrls[keys[index]] = fileUrl;
          });

          res.status(200).json(uploadedUrls);
        } catch (error) {
          console.log("Lỗi trong quá trình xử lý upload:", error);
          return next(err);
        }
      });
    };
  };
}
