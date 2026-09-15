import { CheckIn, CheckInDirection } from "@/database/models/CheckIn";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateCheckInSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  userId: z.uuid(),
  clubId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
  userPacketId: z.uuid(),
});

export const CreateUserCheckInSchema = BaseCreateSchema.extend({
  clubId: z.uuid(),
  quantity: z.coerce.number().int().positive(),
  userPacketId: z.uuid(),
});

export const UpdateCheckInSchema = BaseUpdateSchema.extend({
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  userPacketId: z.uuid().nullish(),
});

export const CheckInQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
  userPacketId: z.uuid().optional(),
  direction: z.enum(CheckInDirection).optional(),
  paid: zBooleanLike().optional(),
});

export const CheckInReportQuerySchema = CheckInQuerySchema.omit({ clubIds: true }).extend({
  clubId: z.uuid(),
});

export const CheckInTopMembersQuerySchema = CheckInQuerySchema.pick({ startAt: true, endAt: true }).extend({
  clubId: z.uuid(),
});

export const CheckInParamsSchema = BaseParamsSchema;

export type CreateCheckInDto = z.infer<typeof CreateCheckInSchema>;
export type UpdateCheckInDto = z.infer<typeof UpdateCheckInSchema>;
export type CheckInQueryDto = z.infer<typeof CheckInQuerySchema>;
export type CheckInReportQueryDto = z.infer<typeof CheckInReportQuerySchema>;
export type CheckInTopMembersQueryDto = z.infer<typeof CheckInTopMembersQuerySchema>;
export type CheckInParamsDto = z.infer<typeof CheckInParamsSchema>;
