// Redis Helper cho việc sử dụng trong các module khác
import RedisConfig from "@/config/redis";
import logger from "@/shared/utils/logger";

class RedisHelper {
  private static instance: RedisHelper;

  private constructor() {}

  static getInstance(): RedisHelper {
    if (!RedisHelper.instance) {
      RedisHelper.instance = new RedisHelper();
    }
    return RedisHelper.instance;
  }

  // Kiểm tra kết nối Redis
  async checkConnection(): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not initialized");
        return false;
      }

      const result = await client.ping();
      return result === "PONG";
    } catch (error) {
      logger.error("Redis connection check failed:", error);
      return false;
    }
  }

  // Get Redis client
  getClient() {
    return RedisConfig.getClient();
  }

  // Set key-value với TTL
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return false;
      }

      if (ttl) {
        await client.setex(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET failed:", error);
      return false;
    }
  }

  // Get value by key
  async get(key: string): Promise<string | null> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return null;
      }

      return await client.get(key);
    } catch (error) {
      logger.error("Redis GET failed:", error);
      return null;
    }
  }

  // Delete key
  async del(key: string): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return false;
      }

      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      logger.error("Redis DEL failed:", error);
      return false;
    }
  }

  // Set JSON object
  async setJson(key: string, value: object, ttl?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttl);
    } catch (error) {
      logger.error("Redis SET JSON failed:", error);
      return false;
    }
  }

  // Get JSON object
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const jsonString = await this.get(key);
      if (!jsonString) return null;

      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error("Redis GET JSON failed:", error);
      return null;
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return false;
      }

      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      logger.error("Redis EXISTS failed:", error);
      return false;
    }
  }

  // Set TTL cho key
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return false;
      }

      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error("Redis EXPIRE failed:", error);
      return false;
    }
  }

  // Get TTL của key
  async ttl(key: string): Promise<number> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return -1;
      }

      return await client.ttl(key);
    } catch (error) {
      logger.error("Redis TTL failed:", error);
      return -1;
    }
  }

  // Clear tất cả keys (cẩn thận khi dùng)
  async flushAll(): Promise<boolean> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return false;
      }

      await client.flushall();
      return true;
    } catch (error) {
      logger.error("Redis FLUSHALL failed:", error);
      return false;
    }
  }

  // Lấy tất cả keys theo pattern
  async keys(pattern: string): Promise<string[]> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return [];
      }

      return await client.keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS failed:", error);
      return [];
    }
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return 0;
      }

      return await client.incr(key);
    } catch (error) {
      logger.error("Redis INCR failed:", error);
      return 0;
    }
  }

  // Decrement counter
  async decr(key: string): Promise<number> {
    try {
      const client = RedisConfig.getClient();
      if (!client) {
        logger.warn("Redis client is not available");
        return 0;
      }

      return await client.decr(key);
    } catch (error) {
      logger.error("Redis DECR failed:", error);
      return 0;
    }
  }
}

export default RedisHelper.getInstance();
