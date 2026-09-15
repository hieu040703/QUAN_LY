import {
  AddressSchema,
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  zArrayable,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { z } from "zod";
import { CreateClubActivitySchema, UpdateClubActivitySchema } from "../clubActivity/clubActivity.validator";

export const UpdateClubActivityFromClubSchema = z.union([
  // Activity đã tồn tại: bắt buộc có id, các field còn lại có thể cập nhật từng phần.
  UpdateClubActivitySchema.extend({ id: z.uuid() }),
  // Activity mới: không có id và bắt buộc có đủ thông tin khung giờ.
  CreateClubActivitySchema.extend({ id: z.uuid().nullish() }),
]);

export const CreateClubSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1).max(256),
  hotline: z.string().trim().max(40).nullish(),
  isActive: z.boolean().optional(),
  address: AddressSchema,
  latitude: z.string().trim().min(1),
  longitude: z.string().trim().min(1),
  leaderId: z.uuid().nullish(),
  openingDay: z.coerce.date().optional(),
  capacity: z.coerce.number().int().nonnegative(),
  // clubId được gắn tự động qua quan hệ cascade khi tạo Club.
  clubActivities: z.array(CreateClubActivitySchema.extend({ clubId: z.uuid().optional() })).optional(),
});

export const UpdateClubSchema = BaseUpdateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1).max(256).optional(),
  hotline: z.string().trim().max(40).nullish(),
  isActive: z.boolean().optional(),
  address: AddressSchema.optional(),
  latitude: z.string().trim().min(1).optional(),
  longitude: z.string().trim().min(1).optional(),
  leaderId: z.uuid().nullish(),
  openingDay: z.coerce.date().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
  clubActivities: z.array(UpdateClubActivityFromClubSchema).optional(),
});

export const ClubQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
  // Tọa độ của người dùng, dùng để tìm và sắp xếp CLB theo khoảng cách.
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  // Bán kính tính theo km. Mặc định 10km khi isNearby=true.
  radius: z.coerce.number().positive().optional(),
  isNearby: zBooleanLike(),
  date: z.coerce.date().optional(),
  isManager: zBooleanLike(),
  leaderIds: zArrayable(z.uuid()).optional(),
  isActive: zBooleanLike().optional(),
  isMine: zBooleanLike().optional(),
});

export const UpdateIsActiveClub = z.object({
  isActive: z.boolean(),
});

export const ClubParamsSchema = BaseParamsSchema;

export type CreateClubDto = z.infer<typeof CreateClubSchema>;
export type UpdateClubDto = z.infer<typeof UpdateClubSchema>;
export type ClubQueryDto = z.infer<typeof ClubQuerySchema>;
export type ClubParamsDto = z.infer<typeof ClubParamsSchema>;
