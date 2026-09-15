import { BaseCreateSchema, BaseParamsSchema, BaseQuerySchema, BaseUpdateSchema } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateClubActivitySchema = BaseCreateSchema.extend({
  // clubId: z.uuid(),
  // Quy ước: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7.
  day: z.coerce.number().int().min(0).max(6),
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
});

export const UpdateClubActivitySchema = BaseUpdateSchema.extend({
  // clubId: z.uuid().optional(),
  day: z.coerce.number().int().min(0).max(6).optional(),
  start: z.string().trim().min(1).optional(),
  end: z.string().trim().min(1).optional(),
});

export const ClubActivityQuerySchema = BaseQuerySchema.extend({
  clubId: z.uuid().optional(),
});

export const ClubActivityParamsSchema = BaseParamsSchema;

export type CreateClubActivityDto = z.infer<typeof CreateClubActivitySchema>;
export type UpdateClubActivityDto = z.infer<typeof UpdateClubActivitySchema>;
export type ClubActivityQueryDto = z.infer<typeof ClubActivityQuerySchema>;
export type ClubActivityParamsDto = z.infer<typeof ClubActivityParamsSchema>;
