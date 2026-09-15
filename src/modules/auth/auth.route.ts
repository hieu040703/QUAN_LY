import { Router } from "express";
import { injectable, inject } from "inversify";
import { AuthController } from "./auth.controller";

import { zodValidate } from "@/shared/middleware/validation.middleware";
import {
  LoginSchema,
  PayloadWithEmailSchema,
  PayloadWithPasswordSchema,
  UpdateInfoSchema,
  VerifyOtpSchema,
  FirebaseLoginSchema,
  FirebaseRegisterSchema,
  CheckPhoneSchema,
  VerifyPhoneSchema,
  CheckEmailSchema,
  VerifyEmailSchema,
  RegisterPhoneSchema,
  RegisterSchema,
  ForgotPasswordPhoneSchema,
  RegisterTrialPackageSchema,
} from "./auth.validator";
import { authenticate } from "@/shared/middleware/auth.middleware";
import { AUTH_TYPES } from "./auth.types";
import { UnregisterDeviceSchema } from "../device/device.validator";

@injectable()
export class AuthRouter {
  private router: Router;

  constructor(
    @inject(AUTH_TYPES.AuthController)
    private authController: AuthController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public routes
    this.router.post("/login", zodValidate(LoginSchema, "body"), this.authController.login);

    // Đăng nhập / đăng ký khách hàng bằng Firebase
    this.router.post("/firebase/login", zodValidate(FirebaseLoginSchema, "body"), this.authController.firebaseLogin);

    // Dọn device khi session hết hạn (endpoint public — không cần xác thực)
    this.router.post("/logout-device", zodValidate(UnregisterDeviceSchema, "body"), this.authController.logoutDevice);

    // Đăng ký web không dùng Firebase: check email -> verify email -> register
    // this.router.post("/register", zodValidate(RegisterSchema, "body"), this.authController.register);

    // Đăng ký bằng Firebase vẫn được hỗ trợ ở endpoint riêng
    this.router.post("/register", zodValidate(FirebaseRegisterSchema, "body"), this.authController.firebaseRegister);

    this.router.post("/register-phone", zodValidate(RegisterPhoneSchema, "body"), this.authController.registerPhone);

    // Kiểm tra email / số điện thoại đã tồn tại chưa
    this.router.post("/check-email", zodValidate(CheckEmailSchema, "body"), this.authController.checkEmail);

    this.router.post("/check-phone", zodValidate(CheckPhoneSchema, "body"), this.authController.checkPhone);

    // Xác thực email / số điện thoại
    this.router.post("/verify-email", zodValidate(VerifyEmailSchema, "body"), this.authController.verifyEmail);

    this.router.post("/verify-phone", zodValidate(VerifyPhoneSchema, "body"), this.authController.verifyPhone);

    this.router.post("/verify-otp", zodValidate(VerifyOtpSchema, "body"), this.authController.verifyOtp);

    this.router.post("/resend-otp", this.authController.resendOtp);

    this.router.post(
      "/forgot-password",
      zodValidate(PayloadWithEmailSchema, "body"),
      this.authController.forgotPassword,
    );

    this.router.post(
      "/forgot-password/phone",
      zodValidate(ForgotPasswordPhoneSchema, "body"),
      this.authController.forgotPasswordPhone,
    );

    this.router.post(
      "/reset-password",
      zodValidate(PayloadWithPasswordSchema, "body"),
      this.authController.resetPassword,
    );

    // Protected routes
    this.router.post("/logout", authenticate, this.authController.logout);
    this.router.post("/refresh-token", authenticate, this.authController.refreshToken);
    this.router.get("/me", authenticate, this.authController.getCurrentUser);
    this.router.put(
      "/update-info",
      authenticate,
      zodValidate(UpdateInfoSchema, "body"),
      this.authController.updateInfo,
    );
    this.router.post(
      "/register-trial-package",
      authenticate,
      zodValidate(RegisterTrialPackageSchema, "body"),
      this.authController.registerTrialPackage,
    );
    this.router.get("/notification", authenticate, this.authController.getUserNotifications);
    this.router.put("/change-password", authenticate, this.authController.changePassword);

    this.router.post("/notification/mark-as-read/all", authenticate, this.authController.seenAllUserNotification);
    this.router.post("/notification/:id/mark-as-read", authenticate, this.authController.seenUserNotification);
  }

  public getRouter(): Router {
    return this.router;
  }
}
