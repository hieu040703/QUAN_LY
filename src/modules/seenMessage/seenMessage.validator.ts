import { DateTransform, BaseCreateSchema, BaseParamsSchema, BaseQuerySchema, BaseUpdateSchema } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateSeenMessageSchema = BaseCreateSchema.extend({
  refId: z.uuid(),
  userId: z.uuid(),
  seenAt: DateTransform.optional(),
});

export const UpdateSeenMessageSchema = BaseUpdateSchema.extend({
  refId: z.uuid().optional(),
  userId: z.uuid().optional(),
  seenAt: DateTransform.optional(),
});

export const SeenMessageQuerySchema = BaseQuerySchema.extend({
  refId: z.uuid().optional(),
});

export const SeenMessageParamsSchema = BaseParamsSchema;

export type CreateSeenMessageDto = z.infer<typeof CreateSeenMessageSchema>;
export type UpdateSeenMessageDto = z.infer<typeof UpdateSeenMessageSchema>;
export type SeenMessageQueryDto = z.infer<typeof SeenMessageQuerySchema>;
export type SeenMessageParamsDto = z.infer<typeof SeenMessageParamsSchema>;
