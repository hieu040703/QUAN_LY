import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import {
  LoginDto,
  PayloadWithPasswordDto,
  VerifyOtpDto,
  FirebaseLoginDto,
  FirebaseRegisterDto,
  CheckPhoneDto,
  VerifyPhoneDto,
  CheckEmailDto,
  VerifyEmailDto,
  RegisterPhoneDto,
  RegisterDto,
} from "./auth.validator";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { AuthTokens } from "@/shared/types/interfaces";
import { UnauthorizedError, NotFoundError, BadRequestError, ConflictError } from "@/shared/types/errors";
import { Request, Response } from "express";
import { AuthRepository } from "./auth.repository";
import { AuthRelations, AuthSelectFull } from "./auth.select";
import { User } from "@/database/models/User";
import { Token } from "@/database/models/Token";
import { ErrorsMessages } from "@/shared/constants/errors";
import dayjs from "dayjs";
import { VerifyOtpRepository } from "../verifyOtp/verifyOtp.repository";
import { AUTH_TYPES } from "./auth.types";
import { VERIFY_OTP_TYPES } from "../verifyOtp";
import { createPermissions, PermissionStructure } from "@/shared/middleware/permission.middleware";
import { UserRelations } from "../user/user.select";
import { DeepPartial, EntityManager, In, Not } from "typeorm";
import logger from "@/shared/utils/logger";
import { config } from "@/config/env";
import { htmlOtpContent } from "@/shared/utils/email/htmlContent.util";
import { EmailUtils } from "@/shared/utils/email/sendMail.utils";
import { VerifyOtpTypeEnum } from "@/database/models/VerifyOtp";
import { getAuth } from "firebase-admin/auth";
import { generateCode } from "@/shared/utils/code.utils";
import { withTransaction } from "@/shared/base/TransactionManager";
import RedisHelper from "@/shared/utils/redis.helper";
import { Utils } from "@/shared/utils/utils";
import DatabaseConfig from "@/config/database";
import { DeviceService } from "../device/device.service";
import { DEVICE_TYPES } from "../device/device.types";

/**
 * Chuẩn hóa số điện thoại về dạng đầu 0 (0xxxxxxxxx).
 * Firebase thường trả số dạng +84xxxxxxxxx, trong khi hệ thống lưu/dùng số đầu 0.
 */
const normalizePhone = (phone?: string | null): string | null => {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (trimmed.startsWith("+84")) return `0${trimmed.slice(3)}`;
  if (trimmed.startsWith("84") && trimmed.length > 9 && !trimmed.startsWith("840")) {
    return `0${trimmed.slice(2)}`;
  }
  return trimmed;
};

@injectable()
export class AuthService extends BaseService<User> {
  protected repository: AuthRepository;
  protected relations = AuthRelations;
  protected selectedFields = AuthSelectFull;
  constructor(
    @inject(AUTH_TYPES.AuthRepository)
    authRepository: AuthRepository,
    @inject(VERIFY_OTP_TYPES.VerifyOtpRepository)
    private verifyOtpRepository: VerifyOtpRepository,
    @inject(DEVICE_TYPES.DeviceService)
    private deviceService: DeviceService,
  ) {
    super();
    this.repository = authRepository;
  }

  // ==================== ĐĂNG KÝ KHÁCH HÀNG (OTP qua Redis) ====================

  /** Kiểm tra số điện thoại: đã tồn tại (đăng ký) hoặc chưa đăng ký (forgot password) */
  async checkPhone(data: CheckPhoneDto): Promise<{ verifyKey: string }> {
    const phone = normalizePhone(data.phone);
    if (!phone) throw new BadRequestError("Thiếu thông tin số điện thoại");
    const user = await this.repository.findByPhone(phone);
    if (data.isForgotPassword) {
      if (!user) throw new NotFoundError("Số điện thoại chưa được đăng ký");
    } else {
      if (user) throw new ConflictError("Số điện thoại đã tồn tại");
    }
    return { verifyKey: Utils.generateRandomString(10) };
  }

  /** Kiểm tra email: đã tồn tại (đăng ký) hoặc chưa đăng ký (forgot password) */
  async checkEmail(data: CheckEmailDto): Promise<{ verifyKey: string }> {
    const user = await this.repository.findByEmail(data.email);
    if (data.isForgotPassword) {
      if (!user) throw new NotFoundError("Email chưa được đăng ký");
    } else {
      if (user) throw new ConflictError("Email đã tồn tại");
    }
    return { verifyKey: Utils.generateRandomString(10) };
  }

  /** Gửi mã xác thực qua số điện thoại: lưu verifyKey vào Redis + cookie */
  async verifyPhone(data: VerifyPhoneDto, res: Response): Promise<{ phone: string; verifyKey: string }> {
    const user = await this.repository.findByPhone(data.phone);
    if (data.isForgotPassword) {
      if (!user) throw new NotFoundError("Số điện thoại chưa được đăng ký");
    } else {
      if (user) throw new ConflictError("Số điện thoại đã tồn tại");
    }

    const verifyKey = Utils.generateRandomString(30);
    await RedisHelper.set(data.phone, verifyKey, 5 * 60);
    res.cookie("verifyKey", verifyKey, { maxAge: 5 * 60 * 1000, httpOnly: true });

    return { phone: data.phone, verifyKey };
  }

  /** Gửi mã OTP qua email: lưu {verifyKey, verifyCode} vào Redis + gửi email */
  async verifyEmail(data: VerifyEmailDto): Promise<{ email: string; verifyKey: string; verifyCode: string }> {
    const user = await this.repository.findByEmail(data.email);
    if (data.isForgotPassword) {
      if (!user) throw new NotFoundError("Email chưa được đăng ký");
    } else {
      if (user) throw new ConflictError("Email đã tồn tại");
    }

    const verifyKey = Utils.generateRandomString(10);
    const verifyCode = Utils.generateRandomString(6);
    const expiresAt = dayjs().add(config.OTP_EXPIRES_MINUTES, "minute").toISOString();
    await RedisHelper.setJson(data.email, { verifyKey, verifyCode }, 5 * 60);
    await EmailUtils.sendEmail(data.email, "Mã xác thực đăng ký tài khoản", htmlOtpContent(verifyCode, expiresAt));

    return { email: data.email, verifyKey, verifyCode };
  }

  /** Đăng ký tài khoản khách hàng bằng số điện thoại (verifyKey từ cookie/Redis) */
  async registerPhone(data: RegisterPhoneDto, req: Request, res: Response): Promise<{ user: User }> {
    // Rate limiting 5 lần/giờ
    const rateLimitKey = `rate_limit:phone:${data.phone}`;
    const requestCount = await RedisHelper.incr(rateLimitKey);
    if (requestCount === 1) await RedisHelper.expire(rateLimitKey, 60 * 60);
    if (requestCount > 5) throw new BadRequestError("Quá nhiều yêu cầu, vui lòng thử lại sau");

    const verifyKey = req.cookies?.["verifyKey"];
    const redisData = await RedisHelper.get(data.phone);
    if (!verifyKey || !redisData || redisData !== verifyKey) {
      throw new UnauthorizedError("Mã xác thực không hợp lệ");
    }

    const existing = await this.repository.findByPhone(data.phone);
    if (existing) throw new ConflictError("Số điện thoại đã tồn tại");

    const user = await withTransaction(async (manager) => {
      return manager.getRepository(User).save({
        code: await generateCode("user"),
        username: data.phone,
        name: data.name || data.phone,
        phone: data.phone,
        email: null,
        password: await AuthUtils.hashPassword(data.password),
      } as Partial<User>);
    });

    await this.issueTokens(user, res);
    await RedisHelper.del(data.phone);

    return { user };
  }

  /** Đăng ký tài khoản khách hàng bằng email (verifyKey + verifyCode từ Redis) */
  async register(data: RegisterDto, res: Response): Promise<{ user: User }> {
    const { email, phone, password, verifyKey, verifyCode, name } = data;

    if (email) {
      const existing = await this.repository.findByEmail(email);
      if (existing) throw new ConflictError("Email đã tồn tại");
    }
    if (phone) {
      const existing = await this.repository.findByPhone(phone);
      if (existing) throw new ConflictError("Số điện thoại đã tồn tại");
    }

    const dataCheck = email || phone || "";
    const redisData = await RedisHelper.getJson<{ verifyKey: string; verifyCode: string }>(dataCheck);
    if (!redisData || redisData.verifyKey !== verifyKey || redisData.verifyCode !== verifyCode) {
      throw new UnauthorizedError("Mã xác thực không hợp lệ");
    }

    const user = await withTransaction(async (manager) => {
      return manager.getRepository(User).save({
        code: await generateCode("user"),
        username: email || phone || "",
        name: name || email?.split("@")[0] || "",
        email: email || null,
        phone: phone || null,
        password: await AuthUtils.hashPassword(password),
      } as Partial<User>);
    });

    await this.issueTokens(user, res);
    await RedisHelper.del(dataCheck);

    return { user };
  }

  /** Cấp JWT, set cookie và lưu refresh token vào bảng tokens */
  private async issueTokens(user: User, res: Response): Promise<AuthTokens> {
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });
    AuthUtils.setTokenCookies(res, tokens);
    await this.saveRefreshToken(user.id, tokens.refreshToken as string);
    return tokens;
  }

  /** Lưu refresh token vào bảng tokens */
  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await DatabaseConfig.getRepository(Token).save({ userId, refreshToken } as Partial<Token>);
  }

  /** Tạo access token mới khi refresh token còn hạn */
  async refreshToken(userId: string, refreshToken: string, res: Response): Promise<{ accessToken: string }> {
    const user = await this.repository.findById(userId);
    if (!user) throw new BadRequestError("Người dùng không tồn tại");

    const tokenInDb = await DatabaseConfig.getRepository(Token).findOne({ where: { userId, refreshToken } });
    if (!tokenInDb) throw new BadRequestError("Refresh token không hợp lệ");

    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });
    AuthUtils.setTokenCookies(res, tokens);
    await this.saveRefreshToken(user.id, tokens.refreshToken as string);

    return { accessToken: tokens.accessToken };
  }

  async login(loginData: LoginDto, res: Response): Promise<{ user: User; tokens: AuthTokens }> {
    // Rate limiting: tối đa 10 lần / 3 phút cho mỗi username
    const rateLimitKey = `rate_limit:login:${loginData.username}`;
    const requestCount = await RedisHelper.incr(rateLimitKey);
    if (requestCount === 1) await RedisHelper.expire(rateLimitKey, 3 * 60);
    if (requestCount > 10) throw new BadRequestError("Quá nhiều lần đăng nhập, vui lòng thử lại sau");

    // Find user by username
    const user = await this.repository.findByUsername(loginData.username);
    if (!user) {
      throw new BadRequestError("Không tìm thấy tài khoản", "username");
    }

    // Check password
    const isPasswordValid = await AuthUtils.comparePassword(loginData.password, user.password as string);
    if (!isPasswordValid) {
      throw new BadRequestError("Mật khẩu không chính xác", "password");
    }

    // Generate tokens
    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });

    AuthUtils.setTokenCookies(res, tokens);
    await this.saveRefreshToken(user.id, tokens.refreshToken as string);
    await RedisHelper.del(rateLimitKey);

    // Lưu/update device (FCM token) để sau này gửi push notification
    if (loginData.fcmToken) {
      try {
        await this.deviceService.register(user.id, loginData.fcmToken, loginData.platform || null);
      } catch (err) {
        logger.error("Error AuthService:[login] register device:", err);
      }
    }

    return { user, tokens };
  }

  async logout(userId: string, fcmToken?: string | null): Promise<void> {
    await this.repository.updateRefreshToken(userId, null);

    // Hủy đăng ký device (FCM token) khi đăng xuất để không còn nhận push notification
    if (fcmToken) {
      try {
        await this.deviceService.unregister(userId, fcmToken);
      } catch (err) {
        logger.error("Error AuthService:[logout] unregister device:", err);
      }
    }
  }

  /**
   * Dọn device khỏi hệ thống khi session hết hạn (token expired)
   * mà client không thể gọi logout có xác thực.
   */
  async logoutDevice(fcmToken: string): Promise<void> {
    await this.deviceService.unregisterByToken(fcmToken);
  }

  async getCurrent(userId: string): Promise<{
    user: User;
    permissions: PermissionStructure;
    hasManager: boolean;
  }> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: UserRelations,
    });

    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    const userWithFiles = await this.repository.attachFilesToEntity(user);

    let permissions: PermissionStructure = user.role?.permissions || {};

    if (user.username === "admin") {
      permissions = createPermissions();
      return {
        user: userWithFiles,
        permissions,
        hasManager: true,
      };
    }

    const hasRoleId = !!user.roleId;

    return {
      user: userWithFiles,
      permissions,
      hasManager: hasRoleId,
    };
  }

  async updateInfo(userId: string, data: Partial<User>): Promise<void> {
    await this.repository.update(userId, data);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.getById(userId);
    const isOldPasswordValid = await AuthUtils.comparePassword(oldPassword, user.password as string);
    if (!isOldPasswordValid) {
      throw new UnauthorizedError("Old password is incorrect");
    }
    const newHashedPassword = await AuthUtils.hashPassword(newPassword);
    await this.repository.getRepository().update(userId, {
      password: newHashedPassword,
    } as any);
  }

  async verifyOtp(data: VerifyOtpDto, otpId: string): Promise<void> {
    const { otp } = data;
    const verifyOtp = await this.verifyOtpRepository.findById(otpId);
    if (!verifyOtp) {
      throw new BadRequestError("Không tìm thấy OTP", "otp");
    }

    if (verifyOtp.isUsed) {
      throw new BadRequestError("OTP đã được sử dụng", "otp");
    }

    if (verifyOtp.otp !== otp) {
      throw new BadRequestError("Mã OTP không chính xác", "otp");
    }

    const isExpired = verifyOtp.expiresAt ? dayjs().isAfter(dayjs(verifyOtp.expiresAt)) : false;
    if (isExpired) {
      throw new UnauthorizedError("Mã OTP đã hết hạn", "otp");
    }

    await this.verifyOtpRepository.update(verifyOtp.id, {
      isUsed: true,
    });
  }

  async resendOtp(otpId: string): Promise<void> {
    const verifyOtp = await this.verifyOtpRepository.findById(otpId);
    if (!verifyOtp) {
      throw new BadRequestError("Không tìm thấy OTP", "otp");
    }

    const otp = AuthUtils.generateOTP();
    const expiresAt = dayjs().add(config.OTP_EXPIRES_MINUTES, "minute").toISOString();
    await this.verifyOtpRepository.update(otpId, {
      otp,
      expiresAt: new Date(expiresAt),
    });

    if (verifyOtp.email) {
      EmailUtils.sendEmail(verifyOtp.email, "Verification Code for Registration", htmlOtpContent(otp, expiresAt));
    }
  }

  async forgotPassword(email: string, res: Response): Promise<void> {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("Không tìm tài khoản tương ứng");
    }

    const otp = AuthUtils.generateOTP();
    const expiresAt = dayjs().add(config.OTP_EXPIRES_MINUTES, "minute").toISOString();
    const verifyOtp = await this.verifyOtpRepository.create({
      otp,
      expiresAt,
      email: email,
      type: VerifyOtpTypeEnum.FORGOT_PASSWORD,
    });

    EmailUtils.sendEmail(email, "Verification Code for Password Reset", htmlOtpContent(otp, expiresAt));

    AuthUtils.setTokenVerifyOtpCookies(res, verifyOtp.id);
  }

  /** Quên mật khẩu qua số điện thoại: tạo mã OTP + gửi qua SMS (nếu có) */
  async forgotPasswordPhone(phone: string, res: Response): Promise<{ otp: string }> {
    const user = await this.repository.findByPhone(phone);
    if (!user) {
      throw new NotFoundError("Không tìm tài khoản tương ứng");
    }

    const otp = AuthUtils.generateOTP();
    const expiresAt = dayjs().add(config.OTP_EXPIRES_MINUTES, "minute").toISOString();
    const verifyOtp = await this.verifyOtpRepository.create({
      otp,
      expiresAt,
      phone,
      type: VerifyOtpTypeEnum.FORGOT_PASSWORD,
    });

    // TODO: tích hợp gửi SMS. Hiện tại trả OTP trong response (chưa có hạ tầng SMS).
    AuthUtils.setTokenVerifyOtpCookies(res, verifyOtp.id);

    return { otp };
  }

  async resetPassword(data: PayloadWithPasswordDto, otpId: string): Promise<void> {
    const { password, verifyKey } = data;
    const newHashedPassword = await AuthUtils.hashPassword(password);

    if (!verifyKey) {
      const verifyOtp = await this.verifyOtpRepository.findById(otpId);
      if (!verifyOtp || !verifyOtp.isUsed) {
        throw new UnauthorizedError("Không tìm thấy OTP hợp lệ", "otp");
      }

      if (verifyOtp.type !== VerifyOtpTypeEnum.FORGOT_PASSWORD || (!verifyOtp.email && !verifyOtp.phone)) {
        throw new BadRequestError("OTP không hợp lệ cho việc đặt lại mật khẩu", "otp");
      }

      const user = verifyOtp.email
        ? await this.repository.findByEmail(verifyOtp.email)
        : verifyOtp.phone
          ? await this.repository.findByPhone(verifyOtp.phone)
          : null;
      if (!user) {
        throw new NotFoundError("Không tìm thấy tài khoản tương ứng");
      }

      await this.repository.update(user.id, {
        password: newHashedPassword,
      } as any);
    } else {
      const decoded = await this.verifyFirebaseToken(verifyKey);
      const phone = normalizePhone(decoded.phone_number);
      if (!phone) throw new BadRequestError("Soos điện thoại không hợp lệ");

      const exist = await this.repository.findByPhone(phone);
      if (!exist) throw new BadRequestError("Không tìm thấy tài khoản");

      await this.repository.update(exist.id, {
        password: newHashedPassword,
      } as any);
    }
  }

  // ==================== FIREBASE (KHÁCH HÀNG) ====================

  /**
   * Xác thực Firebase ID token với cơ chế retry.
   * Server deploy có lỗi DNS/network cố hữu (EAI_AGAIN khi fetch public key
   * từ www.googleapis.com) → retry giúp vượt qua lỗi tạm thời khi DNS phục hồi.
   */
  private async verifyFirebaseToken(idToken: string): Promise<{
    uid: string;
    email?: string;
    phone_number?: string;
    name?: string;
  }> {
    const MAX_RETRY = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        return await getAuth().verifyIdToken(idToken);
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRY) {
          console.warn(
            `Firebase verifyIdToken failed (attempt ${attempt}/${MAX_RETRY}), retrying in ${attempt * 500}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }
    console.error("Firebase verifyIdToken error:", lastError);
    throw new BadRequestError("Không thể xác thực với Firebase, vui lòng thử lại sau");
  }

  /**
   * Đăng nhập khách hàng bằng Firebase ID token.
   * Xác thực token qua Firebase Auth → tìm user theo email/phone → cấp JWT.
   */
  async firebaseLogin(payload: FirebaseLoginDto, res: Response): Promise<{ user: User; tokens: AuthTokens }> {
    const decoded = await this.verifyFirebaseToken(payload.idToken);
    const email = decoded.email || payload.email || null;
    const phone = normalizePhone(decoded.phone_number || payload.phone);

    const user = email
      ? await this.repository.findByEmail(email)
      : phone
        ? await this.repository.findByPhone(phone)
        : null;
    if (!user) {
      throw new NotFoundError("Tài khoản chưa được đăng ký");
    }

    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });
    AuthUtils.setTokenCookies(res, tokens);

    return { user, tokens };
  }

  /**
   * Đăng ký tài khoản khách hàng bằng Firebase ID token.
   * Tạo Customer + User (customerId) trong cùng transaction, sau đó cấp JWT.
   */
  async firebaseRegister(payload: FirebaseRegisterDto, res: Response): Promise<{ user: User; tokens: AuthTokens }> {
    const decoded = await this.verifyFirebaseToken(payload.verifyKey);
    const email = decoded.email || payload.email || null;
    const phone = normalizePhone(decoded.phone_number || payload.phone);
    const name = payload.name || decoded.name || (email ? email.split("@")[0] : "") || "Khách hàng";

    // Nếu tài khoản đã tồn tại → yêu cầu đăng nhập
    const existing = email
      ? await this.repository.findByEmail(email)
      : phone
        ? await this.repository.findByPhone(phone)
        : null;
    if (existing) {
      throw new BadRequestError("Tài khoản đã tồn tại, vui lòng đăng nhập");
    }

    const user = await withTransaction(async (manager) => {
      // Tạo tài khoản user (mật khẩu do khách hàng tự đặt để đăng nhập lại)
      const userEntity = await manager.getRepository(User).save({
        code: await generateCode("user"),
        username: phone || email,
        password: await AuthUtils.hashPassword(payload.password),
        name,
        email,
        phone,
      } as Partial<User>);

      return userEntity;
    });

    const tokens = AuthUtils.generateTokens({
      userId: user.id,
      username: user.username,
    });
    AuthUtils.setTokenCookies(res, tokens);

    return { user, tokens };
  }
}
