// Cấu hình Redis
import Redis from "ioredis";
import { config } from "./env";
import logger from "@/shared/utils/logger";

class RedisConfig {
  private client: Redis | null = null;
  private isConnecting: boolean = false;

  async connect(): Promise<Redis> {
    if (this.client && this.client.status === "ready") {
      return this.client;
    }

    if (this.isConnecting) {
      // Đợi cho đến khi kết nối hoàn thành
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.client!;
    }

    this.isConnecting = true;

    try {
      this.client = new Redis({
        port: config.REDIS_PORT,
        host: config.REDIS_HOST,
        password: config.REDIS_PASSWORD,
        db: 1,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        enableReadyCheck: true,
        lazyConnect: true, // Không kết nối ngay lập tức
        // Giới hạn số lần reconnect để connect() không bị treo vô hạn khi Redis down
        retryStrategy: (times) => {
          if (times > 5) {
            return null; // Dừng reconnect → connect() sẽ reject, app vẫn khởi động bình thường
          }
          return Math.min(times * 200, 2000);
        },
      });

      // Event listeners
      this.client.on("connect", () => {
        logger.info("🎲 Redis connected successfully");
      });

      this.client.on("error", (error) => {
        logger.error("Redis connection error:", error);
      });

      this.client.on("close", () => {
        logger.info("Redis connection closed");
      });

      this.client.on("reconnecting", () => {
        logger.info("Redis reconnecting...");
      });

      // Kết nối
      await this.client.connect();
      this.isConnecting = false;

      return this.client;
    } catch (error) {
      this.isConnecting = false;
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnecting = false;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null && this.client.status === "ready";
  }
}

export default new RedisConfig();
