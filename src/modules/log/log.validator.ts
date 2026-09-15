import { z } from "zod";
import { BaseParamsSchema, BaseQuerySchema } from "@/shared/base/BaseValidator";

export const LogParamsSchema = BaseParamsSchema;

export const LogQuerySchema = BaseQuerySchema.extend({
  actorId: z.uuid().optional(),
  targetId: z.uuid().optional(),
  targetEntity: z.string().trim().optional(),
  action: z.string().trim().optional(),
});

export type LogParamsDto = z.infer<typeof LogParamsSchema>;
export type LogQueryDto = z.infer<typeof LogQuerySchema>;
