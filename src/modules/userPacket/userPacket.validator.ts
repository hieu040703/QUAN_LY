import { UserPacketStatus } from "@/database/models/UserPacket";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateUserPacketSchema = BaseCreateSchema.extend({
  userId: z.uuid().optional(),
  clubId: z.uuid(),
  packetId: z.uuid(),
  startTime: DateTransform,
});

export const UpdateUserPacketSchema = BaseUpdateSchema.extend({
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),
  packetId: z.uuid().optional(),
  status: z.enum(UserPacketStatus).optional(),
});

export const UserPacketQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),
  clubIds: z.array(z.string().uuid()).optional(),
  packetId: z.uuid().optional(),
  packetIds: z.array(z.string().uuid()).optional(),
  quickFilter: z.enum(["all", "active", "expiring", "expired"]).optional(),
});

export const UserPacketParamsSchema = BaseParamsSchema;

export type CreateUserPacketDto = z.infer<typeof CreateUserPacketSchema>;
export type UpdateUserPacketDto = z.infer<typeof UpdateUserPacketSchema>;
export type UserPacketQueryDto = z.infer<typeof UserPacketQuerySchema>;
export type UserPacketParamsDto = z.infer<typeof UserPacketParamsSchema>;
