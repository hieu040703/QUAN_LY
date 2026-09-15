// Middleware để check Redis connection
import { Request, Response, NextFunction } from "express";
import RedisHelper from "@/shared/utils/redis.helper";
import logger from "@/shared/utils/logger";

export const checkRedisConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isConnected = await RedisHelper.checkConnection();

    if (!isConnected) {
      logger.warn("Redis connection is not available for request:", req.path);
      // Có thể continue mà không cần Redis hoặc return error
      // Tùy thuộc vào yêu cầu của ứng dụng
    }

    next();
  } catch (error) {
    logger.error("Error checking Redis connection:", error);
    next(); // Continue without Redis
  }
};

// Middleware optional Redis (không bắt buộc phải có Redis)
export const optionalRedis = (req: Request, res: Response, next: NextFunction): void => {
  // Thêm flag để biết Redis có available không
  req.redisAvailable = RedisHelper.getClient() !== null;
  next();
};

// Middleware required Redis (bắt buộc phải có Redis)
export const requireRedis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isConnected = await RedisHelper.checkConnection();

    if (!isConnected) {
      res.status(503).json({
        error: "Redis service is not available",
        message: "This endpoint requires Redis connection",
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Redis connection check failed:", error);
    res.status(503).json({
      error: "Redis service error",
      message: "Unable to connect to Redis",
    });
    return;
  }
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      redisAvailable?: boolean;
    }
  }
}
