import { BookingStatus } from "@/database/models/Booking";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateBookingSchema = BaseCreateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  userId: z.uuid(),
  clubId: z.uuid(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  quantity: z.coerce.number().int().positive(),
  status: z.enum(BookingStatus).optional(),
});

export const UpdateBookingSchema = BaseUpdateSchema.extend({
  code: z.string().trim().max(50).nullish(),
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  status: z.enum(BookingStatus).optional(),
});

export const BookingQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),
  date: z.coerce.date().optional(),
});

export const BookingParamsSchema = BaseParamsSchema;

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingDto = z.infer<typeof UpdateBookingSchema>;
export type BookingQueryDto = z.infer<typeof BookingQuerySchema>;
export type BookingParamsDto = z.infer<typeof BookingParamsSchema>;
