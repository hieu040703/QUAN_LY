import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { LoginDto, PayloadWithEmailDto } from "@/modules/auth/auth.validator";
import { asyncHandler, sendError, sendResponse } from "@/shared/utils/controller.utils";
import { NotificationService } from "@/modules/notification/notification.service";
import { AuthService } from "./auth.service";
import logger from "@/shared/utils/logger";
import { AUTH_TYPES } from "./auth.types";
import { NOTIFICATION_TYPES } from "../notification/notification.types";
import { UnauthorizedError, BadRequestError } from "@/shared/types/errors";
import { User } from "@/database/models/User";
import { USER_TYPES } from "../user/user.types";
import { UserRepository } from "../user/user.repository";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import { getUserSnapshot } from "@/shared/utils/utils";

@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService) private service: AuthService,
    @inject(NOTIFICATION_TYPES.NotificationService)
    private notificationService: NotificationService,
    @inject(USER_TYPES.UserRepository)
    private userRepository: UserRepository,
  ) {}

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const loginData: LoginDto = req.body;
    // Không log password
    const { password: _password, ...safeBody } = loginData;
    const requestBody = OperationLogUtils.toOperationRecord(safeBody);

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "login",
      targetEntity: "user",
      targetId: null,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      const result = await this.service.login(loginData, res);

      // Remove sensitive data
      const { password, ...userResponse } = result.user;
      const userSnapshot = getUserSnapshot(result.user);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: result.user.id,
          requestBody,
          after: OperationLogUtils.toOperationRecord({
            id: result.user.id,
            username: result.user.username,
          }),

          creatorId: result.user.id,
          creator: userSnapshot,
        });
      }

      sendResponse({
        res,
        data: userResponse,
      });
    } catch (error: any) {
      logger.error("Error AuthController:[login]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          requestBody,
          error,
        });
      }
      next(error);
    }
  });

  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const fcmToken = (req.body as any)?.fcmToken;
    const requestBody = OperationLogUtils.toOperationRecord({ userId });

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "logout",
      targetEntity: "user",
      targetId: userId || null,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      if (userId) await this.service.logout(userId, fcmToken);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: userId || null,
          requestBody,
        });
      }

      sendResponse({
        res,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      logger.error("Error AuthController:[logout]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: userId || null,
          requestBody,
          error,
        });
      }
      // Logout always returns success to client (best-effort)
      sendResponse({
        res,
        message: "Logged out successfully",
      });
    }
  });

  /**
   * Dọn device khi session hết hạn (token expired).
   * Endpoint public: client gọi khi bị out ra do hết token mà không thể xác thực.
   */
  logoutDevice = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fcmToken } = req.body as { fcmToken?: string };
      if (!fcmToken) throw new BadRequestError("Thiếu FCM token");

      await this.service.logoutDevice(fcmToken);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      sendResponse({ res, message: "Device removed" });
    } catch (error: any) {
      logger.error("Error AuthController:[logoutDevice]:", error);
      sendError({
        res,
        message: error.message || "Failed to remove device",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.user || {};
      if (!userId) {
        throw new UnauthorizedError("Không tìm thấy người dùng");
      }

      const { user, permissions, hasManager } =
        await this.service.getCurrent(userId);

      const { password, ...userResponse } = user;

      sendResponse({
        res,
        data: {
          ...userResponse,
          permissions,
          hasManager,
        },
      });
    } catch (error: any) {
      logger.error("Error AuthController:[getCurrentUser]:", error);
      sendError({
        res,
        message: error.message || "Failed to get current user",
        statusCode: 401,
        errors: error.errors || [],
      });
    }
  });

  updateInfo = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const data: Partial<User> = req.body;
    const requestBody = OperationLogUtils.toOperationRecord(data);
    const before = userId ? await this.userRepository.findById(userId) : null;

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "updateInfo",
      targetEntity: "user",
      targetId: userId || null,
      requestBody,
      before: OperationLogUtils.toOperationRecord(before),
      success: false,
      markRequestLogged: true,
    });

    try {
      await this.service.updateInfo(userId!, data);

      const after = userId ? await this.userRepository.findById(userId) : null;

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: userId || null,
          requestBody,
          before: OperationLogUtils.toOperationRecord(before),
          after: OperationLogUtils.toOperationRecord(after),
        });
      }

      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[changeInfo]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: userId || null,
          requestBody,
          before: OperationLogUtils.toOperationRecord(before),
          error,
        });
      }
      sendError({
        res,
        message: "Failed to change user info",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.userId;
    const { oldPassword: _old, newPassword: _new, isLogout } = req.body;
    const requestBody = OperationLogUtils.toOperationRecord({
      isLogout,
    });
    const before = userId ? await this.userRepository.findById(userId) : null;

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "changePassword",
      targetEntity: "user",
      targetId: userId || null,
      requestBody,
      before: OperationLogUtils.toOperationRecord(before),
      success: false,
      markRequestLogged: true,
    });

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const { oldPassword, newPassword } = req.body;
      await this.service.changePassword(userId, oldPassword, newPassword);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: userId,
          requestBody,
          before: OperationLogUtils.toOperationRecord(before),
        });
      }

      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[changePassword]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: userId || null,
          requestBody,
          before: OperationLogUtils.toOperationRecord(before),
          error,
        });
      }
      sendError({
        res,
        message: "Failed to change password",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  getUserNotifications = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.userId;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { page = 1, size = 10 } = req.query;
      const notifications = await this.notificationService.getUserNotifications(userId, Number(page), Number(size));

      res.status(200).json({
        success: true,
        message: "ok",
        data: notifications.data,
        pagination: {
          totalRecords: notifications.total,
          size: notifications.size,
          currentPage: notifications.page,
          totalPages: notifications.totalPages,
        },
        summary: {
          totalUnread: notifications.totalUnread,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("Error AuthController:[getUserNotifications]:", error);
      sendError({
        res,
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  seenUserNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.userId;
    const notificationId = req.params.id;
    const requestBody = OperationLogUtils.toOperationRecord({
      id: notificationId,
    });

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "markAsRead",
      targetEntity: "notification",
      targetId: notificationId || userId || null,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      if (!notificationId) {
        throw new BadRequestError("Thiếu id thông báo");
      }
      await this.notificationService.markAsRead(userId, notificationId);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: notificationId,
          requestBody,
          after: OperationLogUtils.toOperationRecord({
            id: notificationId,
          }),
        });
      }

      sendResponse({ res });
    } catch (error) {
      logger.error("Error AuthController:[seenUserNotification]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: notificationId || userId || null,
          requestBody,
          error,
        });
      }
      sendError({
        res,
        message: (error as any)?.message || "Failed to mark notification as read",
        statusCode: (error as any)?.statusCode || 400,
        errors: (error as any)?.errors || [],
      });
    }
  });

  seenAllUserNotification = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?.userId;
    const requestBody = OperationLogUtils.toOperationRecord({ userId });

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "markAllAsRead",
      targetEntity: "notification",
      targetId: userId || null,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      await this.notificationService.markAllAsRead(userId);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: userId,
          requestBody,
        });
      }

      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[seenAllUserNotification]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: userId || null,
          requestBody,
          error,
        });
      }
      sendError({
        res,
        message: error.message || "Failed to mark all notifications as read",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const token = (req as any).headers["x-verify-otp-token"] || (req as any).cookies?.verifyOtpToken;
    const data = req.body;
    const { otp: _otp, ...safeBody } = data || {};
    const requestBody = OperationLogUtils.toOperationRecord(safeBody);

    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "verify",
      targetEntity: "verifyotp",
      targetId: token || null,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      await this.service.verifyOtp(data, token);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: token || null,
          requestBody,
        });
      }

      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[verifyOtp]:", error);
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          targetId: token || null,
          requestBody,
          error,
        });
      }
      sendError({
        res,
        message: error.message || "OTP verification failed",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  resendOtp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers["x-verify-otp-token"] || req.cookies?.verifyOtpToken;
      await this.service.resendOtp(token);
      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[resendOtp]:", error);
      sendError({
        res,
        message: error.message || "Resend OTP failed",
        errors: error.errors || [],
      });
    }
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as PayloadWithEmailDto;
      await this.service.forgotPassword(email, res);
      sendResponse({ res });
    } catch (error: any) {
      logger.error("Error AuthController:[forgotPassword]:", error);
      sendError({
        res,
        message: error.message || "Forgot password failed",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  forgotPasswordPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;
      const data = await this.service.forgotPasswordPhone(phone, res);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[forgotPasswordPhone]:", error);
      sendError({
        res,
        message: error.message || "Forgot password failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = (req as any).headers["x-verify-otp-token"] || (req as any).cookies?.verifyOtpToken;

      const data = req.body;
      await this.service.resetPassword(data, token);
      sendResponse({ res, message: "Password reset successfully" });
    } catch (error: any) {
      logger.error("Error AuthController:[resetPassword]:", error);
      sendError({
        res,
        message: error.message || "Password reset failed",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  firebaseLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.firebaseLogin(req.body, res);
      const { password: _password, ...userResponse } = result.user;
      sendResponse({ res, data: userResponse });
    } catch (error: any) {
      logger.error("Error AuthController:[firebaseLogin]:", error);
      sendError({
        res,
        message: error.message || "Firebase login failed",
        statusCode: 401,
        errors: error.errors || [],
      });
    }
  });

  firebaseRegister = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.firebaseRegister(req.body, res);
      const { password: _password, ...userResponse } = result.user;
      sendResponse({ res, data: userResponse });
    } catch (error: any) {
      logger.error("Error AuthController:[firebaseRegister]:", error);
      sendError({
        res,
        message: error.message || "Firebase register failed",
        statusCode: 400,
        errors: error.errors || [],
      });
    }
  });

  // ===== Đăng ký khách hàng (OTP qua Redis) =====

  checkPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.checkPhone(req.body);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[checkPhone]:", error);
      sendError({
        res,
        message: error.message || "Check phone failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  checkEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.checkEmail(req.body);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[checkEmail]:", error);
      sendError({
        res,
        message: error.message || "Check email failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  verifyPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.verifyPhone(req.body, res);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[verifyPhone]:", error);
      sendError({
        res,
        message: error.message || "Verify phone failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.verifyEmail(req.body);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[verifyEmail]:", error);
      sendError({
        res,
        message: error.message || "Verify email failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  registerPhone = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.registerPhone(req.body, req, res);
      const { password: _password, ...userResponse } = result.user;
      sendResponse({ res, data: userResponse });
    } catch (error: any) {
      logger.error("Error AuthController:[registerPhone]:", error);
      sendError({
        res,
        message: error.message || "Register phone failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.register(req.body, res);
      const { password: _password, ...userResponse } = result.user;
      sendResponse({ res, data: userResponse });
    } catch (error: any) {
      logger.error("Error AuthController:[register]:", error);
      sendError({
        res,
        message: error.message || "Register failed",
        statusCode: error.statusCode || 400,
        errors: error.errors || [],
      });
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any)?.userId;
      const { refreshToken } = req.body;
      if (!userId || !refreshToken) {
        throw new BadRequestError("Thiếu thông tin refresh token");
      }
      const data = await this.service.refreshToken(userId, refreshToken, res);
      sendResponse({ res, data });
    } catch (error: any) {
      logger.error("Error AuthController:[refreshToken]:", error);
      sendError({
        res,
        message: error.message || "Refresh token failed",
        statusCode: error.statusCode || 401,
        errors: error.errors || [],
      });
    }
  });
}
