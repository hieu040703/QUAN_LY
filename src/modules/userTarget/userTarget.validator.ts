import { UserTargetProgressType, UserTargetStatus } from "@/database/models/UserTarget";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateUserTargetSchema = BaseCreateSchema.extend({
  target: z.coerce.number(),
  deadline: DateTransform,
  startTime: DateTransform,
  progressType: z.enum(UserTargetProgressType).default(UserTargetProgressType.LINEAR),
  startValue: z.coerce.number().nullish(),
});

export const UpdateUserTargetSchema = BaseUpdateSchema.extend({
  target: z.coerce.number().optional(),
  deadline: z.coerce.date().optional(),
  startTime: DateTransform.optional(),
  status: z.enum(UserTargetStatus).optional(),
});

export const UserTargetQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
});

export const UserTargetParamsSchema = BaseParamsSchema;

export type CreateUserTargetDto = z.infer<typeof CreateUserTargetSchema>;
export type UpdateUserTargetDto = z.infer<typeof UpdateUserTargetSchema>;
export type UserTargetQueryDto = z.infer<typeof UserTargetQuerySchema>;
export type UserTargetParamsDto = z.infer<typeof UserTargetParamsSchema>;
