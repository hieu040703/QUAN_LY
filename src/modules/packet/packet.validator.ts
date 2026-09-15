import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreatePacketSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1),
  quota: z.coerce.number().int().nonnegative(),
  dayLimit: z.coerce.number().int().nonnegative(),
  amount: z.coerce.number().nonnegative(),
  bookingAmount: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const UpdatePacketSchema = BaseUpdateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  name: z.string().trim().min(1).optional(),
  quota: z.coerce.number().int().nonnegative().optional(),
  dayLimit: z.coerce.number().int().nonnegative().optional(),
  amount: z.coerce.number().nonnegative().optional(),
  bookingAmount: z.coerce.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const PacketQuerySchema = BaseQuerySchema;
export const PacketParamsSchema = BaseParamsSchema;

export type CreatePacketDto = z.infer<typeof CreatePacketSchema>;
export type UpdatePacketDto = z.infer<typeof UpdatePacketSchema>;
export type PacketQueryDto = z.infer<typeof PacketQuerySchema>;
export type PacketParamsDto = z.infer<typeof PacketParamsSchema>;
