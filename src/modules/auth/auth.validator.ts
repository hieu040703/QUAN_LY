import { AddressSchema, DateTransform } from "@/shared/base/BaseValidator";
import { GenderEnum } from "@/shared/constants/enum";
import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
  // FCM token để lưu/update device cho push notification
  fcmToken: z.string().trim().max(512).optional(),
  platform: z.string().trim().max(50).optional(),
});

export const SeenNotificationSchema = z.object({
  ids: z.array(z.uuid()).min(1, "notificationIds.min"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().trim().optional(),
});
export const UpdateInfoSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().nullish(),
  phone: z.string().trim().min(10).max(15).nullish(),
  gender: z.enum(GenderEnum).nullish(),
  dob: DateTransform.nullish(),
  address: AddressSchema.nullish(),
});

export const PayloadWithEmailSchema = z.object({
  email: z
    .string({
      message: "email.required",
    })
    .email("email.invalid"),
});

export const ForgotPasswordPhoneSchema = z.object({
  phone: z.string().trim().min(10).max(15),
});

export const PayloadWithPasswordSchema = z.object({
  password: z.string().trim().min(6, "password.min").max(128, "password.max"),
  isLogout: z.boolean().optional(),
  verifyKey: z.string().trim().min(1, "idToken.required").optional(),
});
export const VerifyOtpSchema = z.object({
  otp: z.string().trim().min(1, "otp.required").length(6, "otp.length"),
});

// ===== Firebase (khách hàng) =====
export const FirebaseLoginSchema = z.object({
  idToken: z.string().trim().min(1, "idToken.required"),
  email: z.email().nullish(),
  phone: z.string().trim().max(15).nullish(),
});

export const FirebaseRegisterSchema = z.object({
  verifyKey: z.string().trim().min(1, "idToken.required"),
  // Mật khẩu khách hàng tự đặt để đăng nhập lại sau này
  password: z.string().trim().min(6, "password.min").max(128, "password.max"),
  name: z.string().trim().min(1).max(255).optional(),
  email: z.email().nullish(),
  phone: z.string().trim().max(15).nullish(),
  gender: z.enum(GenderEnum),
  dob: DateTransform,
  address: AddressSchema.nullish(),
});

// ===== Đăng ký khách hàng (OTP/verifyKey qua Redis) =====
export const CheckPhoneSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  isForgotPassword: z.boolean().optional(),
});

export const VerifyPhoneSchema = z.object({
  phone: z.string().trim().min(10).max(15),
  isForgotPassword: z.boolean().optional(),
});

export const CheckEmailSchema = z.object({
  email: z.email(),
  isForgotPassword: z.boolean().optional(),
});

export const VerifyEmailSchema = z.object({
  email: z.email(),
  isForgotPassword: z.boolean().optional(),
});

export const RegisterPhoneSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  phone: z.string().trim().min(10).max(15),
  password: z.string().trim().min(6, "password.min").max(128, "password.max"),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.email(),
  phone: z.string().trim().max(15).nullish(),
  password: z.string().trim().min(6, "password.min").max(128, "password.max"),
  verifyKey: z.string().trim().min(1),
  verifyCode: z.string().trim().length(6, "verifyCode.length"),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().trim().min(1),
  newPassword: z.string().trim().min(6, "password.min").max(128, "password.max"),
});


export type LoginDto = z.infer<typeof LoginSchema>;
export type SeenNotificationDto = z.infer<typeof SeenNotificationSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type UpdateInfoDto = z.infer<typeof UpdateInfoSchema>;
export type PayloadWithEmailDto = z.infer<typeof PayloadWithEmailSchema>;
export type ForgotPasswordPhoneDto = z.infer<typeof ForgotPasswordPhoneSchema>;
export type PayloadWithPasswordDto = z.infer<typeof PayloadWithPasswordSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type FirebaseLoginDto = z.infer<typeof FirebaseLoginSchema>;
export type FirebaseRegisterDto = z.infer<typeof FirebaseRegisterSchema>;
export type CheckPhoneDto = z.infer<typeof CheckPhoneSchema>;
export type VerifyPhoneDto = z.infer<typeof VerifyPhoneSchema>;
export type CheckEmailDto = z.infer<typeof CheckEmailSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type RegisterPhoneDto = z.infer<typeof RegisterPhoneSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
