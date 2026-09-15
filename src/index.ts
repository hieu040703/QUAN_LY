import "reflect-metadata";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "@/config/env";
import { DatabaseConfig } from "@/config/database";
import RedisConfig from "@/config/redis";
import "@/config/timezone";
import { errorHandler } from "@/shared/middleware/error.middleware";
import v1Router from "./routes/v1.routes";
import logger from "./shared/utils/logger";
import corsMiddleware from "./shared/middleware/cors.middleware";
import { entities } from "./database/models";
import { configViewEngine } from "./config/viewEngine";
import path from "path";
import { AutoClearTempJob } from "./jobs/autoClearTemp.job";
import { createServer } from "http";
import Socket from "./config/socket";
import { TestFunctionJob } from "./jobs/testFunc.job";
import passport from "passport";
import session from "express-session";
import { initializePassport } from "./config/passport";
import { S3CleanupJob } from "./jobs/s3-cleanup.job";
import { RetryS3UploadJob } from "./jobs/retry-s3-upload.job";
import { CleanupFilesJob } from "./jobs/cleanup-files.job";
import { CancelPacketJob } from "./jobs/cancelPacket.job";
import { SendNotificationJob } from "./jobs/sendNotification";

class App {
  public app: express.Application;
  private isInitialized: boolean = false;

  constructor() {
    this.app = express();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.initializeDatabase();
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeErrorHandling();
      await this.initializeJobs();
      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize app:", error);
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await DatabaseConfig.initialize();
      logger.info("🎲 Database connected successfully");

      const fullRepo = Object.fromEntries(
        entities.map((entity) => [entity.name, DatabaseConfig.getRepository(entity)]),
      );

      this.app.use((req, res, next) => {
        res.locals.fullRepo = fullRepo;
        res.locals.dataSource = DatabaseConfig;
        next();
      });

      // Kết nối Redis (không bắt buộc: nếu lỗi chỉ log cảnh báo,
      // RedisHelper sẽ tự giảm cấp rate limiting/OTP khi client không sẵn sàng)
      try {
        if (!RedisConfig.isConnected()) {
          await RedisConfig.connect();
        }
      } catch (error) {
        logger.warn("Redis connection failed (rate limiting/OTP qua Redis sẽ không hoạt động):", error);
      }
    } catch (error) {
      logger.error("Database connection failed:", error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    this.app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    this.app.use(corsMiddleware);
    this.app.use(compression() as any);
    this.app.use(
      morgan("short", {
        skip: (req) => !req.originalUrl.startsWith("/v1"),
      }),
    );
    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ limit: "100mb", extended: true }));
    this.app.use(cookieParser());
    configViewEngine(this.app);

    // ✅ Setup session TRƯỚC passport
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secret-key-here",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === "production", // true nếu dùng HTTPS
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
      }),
    );

    // ✅ Initialize Passport SAU session
    this.app.use(passport.initialize());
    this.app.use(passport.session()); // ← Quan trọng!
    initializePassport();
    logger.info("✅ Passport initialized");
  }

  private initializeRoutes(): void {
    this.app.use("/v1/", v1Router);
    this.app.get("/test", async (req, res) => {
      await TestFunctionJob.start();
      res.status(200).json({ message: "Test function executed" });
    });
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
      });
    });

    this.app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

    this.app.use("/welcome", (req, res) => {
      res.render("index", { title: "Welcome to API Platform" });
    });

    this.app.use("/", (req, res) => {
      res.status(200).json({
        status: "Welcome",
        message: "Welcome to the API",
        app: config.APP_NAME,
        data: [],
      });
    });
  }

  private async initializeJobs(): Promise<void> {
    AutoClearTempJob.start();
    CancelPacketJob.start();
    AutoClearTempJob.start();
    S3CleanupJob.start();
    RetryS3UploadJob.start();
    CleanupFilesJob.start();
    SendNotificationJob.start();
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ✅ Tạo HTTP server duy nhất
    const httpServer = createServer(this.app);

    // Gắn socket.io vào server đó
    Socket.init(httpServer);

    // Chạy server chung
    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });
  }

  public async shutdown(exitCode: number = 0): Promise<void> {
    try {
      await DatabaseConfig.close();
      // await RedisConfig.disconnect();
      logger.info("Database and Redis connections closed");
      process.exit(exitCode);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

const app = new App();
app.listen();

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  await app.shutdown(0);
});
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await app.shutdown(0);
});
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught Exception:", error);
  await app.shutdown(1);
});
process.on("unhandledRejection", async (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  await app.shutdown(1);
});
