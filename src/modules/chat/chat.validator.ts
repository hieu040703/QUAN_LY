import { ConversationTypeEnum } from "@/database/models/Chat";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateChatSchema = BaseCreateSchema.extend({
  refId: z.uuid(),
  type: z.enum(ConversationTypeEnum),
  content: z.string().trim().min(1).max(5000),
});

export const UpdateChatSchema = BaseUpdateSchema.extend({
  refId: z.uuid().optional(),
  type: z.enum(ConversationTypeEnum).optional(),
  userId: z.uuid().nullish().optional(),
  userSnapshot: z.any().nullish().optional(),
  content: z.string().trim().min(1).max(5000).optional(),
});

export const ChatQuerySchema = BaseQuerySchema.extend({
  refId: z.uuid().optional(),
  type: z.enum(ConversationTypeEnum).optional(),
});
export const SeenMessageSchema = z
  .object({
    bookingId: z.uuid().optional(),
    refId: z.uuid().optional(),
    type: z.enum(ConversationTypeEnum).optional(),
  })
  .refine((data) => data.refId || data.bookingId, { message: "refId là bắt buộc" });

export const ChatParamsSchema = BaseParamsSchema;

export type CreateChatDto = z.infer<typeof CreateChatSchema>;
export type UpdateChatDto = z.infer<typeof UpdateChatSchema>;
export type ChatQueryDto = z.infer<typeof ChatQuerySchema>;
export type ChatParamsDto = z.infer<typeof ChatParamsSchema>;
export type SeenMessageDto = z.infer<typeof SeenMessageSchema>;
