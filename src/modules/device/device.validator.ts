import { z } from "zod";
import { BaseParamsSchema, BaseQuerySchema } from "@/shared/base/BaseValidator";

// Đăng ký FCM token
export const RegisterDeviceSchema = z.object({
  fcmToken: z.string().trim().min(1).max(512),
  platform: z.string().trim().max(50).nullish(),
});

// Hủy đăng ký FCM token
export const UnregisterDeviceSchema = z.object({
  fcmToken: z.string().trim().min(1).max(512),
});

export const DeviceQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
});

export const DeviceParamsSchema = BaseParamsSchema;

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;
export type UnregisterDeviceDto = z.infer<typeof UnregisterDeviceSchema>;
export type DeviceQueryDto = z.infer<typeof DeviceQuerySchema>;
export type DeviceParamsDto = z.infer<typeof DeviceParamsSchema>;
