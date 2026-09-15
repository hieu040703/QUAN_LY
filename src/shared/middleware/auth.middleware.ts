import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { BadRequestError, UnauthorizedError } from "@/shared/types/errors";

import logger from "../utils/logger";
import { config } from "@/config/env";
import { AuthUtils } from "../utils/auth.utils";
import { JwtPayload } from "../types/interfaces";
import DatabaseConfig from "@/config/database";
import { User } from "@/database/models/User";
import { getUserSnapshot } from "../utils/utils";
import { createPermissions } from "./permission.middleware";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    if (!refreshToken && !accessToken) {
      throw new UnauthorizedError("Authentication required");
    }

    // Ưu tiên access token
    if (accessToken) {
      const decoded = jwt.verify(accessToken, config.JWT_ACCESS_SECRET) as JwtPayload;

      req.user = decoded;
      return next();
    }

    // Fallback sang refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as JwtPayload;

    const newAccessToken = AuthUtils.generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
    });

    AuthUtils.setTokenCookies(res, {
      accessToken: newAccessToken,
      refreshToken,
    });

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const userRepo = DatabaseConfig.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    const userSnapshot = getUserSnapshot(user);
    req.userContext = userSnapshot ? { userId: user.id, userSnapshot } : null;

    const scope = req.method === "GET" ? "query" : "body";
    const newData = Object.assign({}, req[scope] as any);

    if (userSnapshot && scope === "body") {
      newData.creatorId = user.id;
      newData.creatorSnapshot = userSnapshot;
      newData.updaterId = user.id;
      newData.updaterSnapshot = userSnapshot;
    }

    // Gán dữ liệu đã được bổ sung thông tin người dùng vào req để controller có thể sử dụng
    Object.defineProperty(req, scope, {
      value: newData,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    if (user.username === "admin") {
      req.permissions = createPermissions();
      return next();
    }

    req.permissions = user.role?.permissions || createPermissions("empty");

    next();
  } catch (error) {
    logger.error("Authorization error:", error);
    next(error);
  }
};
