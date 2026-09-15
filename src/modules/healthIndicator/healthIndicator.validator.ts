import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  DateTransform,
} from "@/shared/base/BaseValidator";
import { HEALTH_INDICATOR_CHART_FIELDS } from "./healthIndicator.types";
import { z } from "zod";

const HealthIndicatorFields = {
  weight: z.coerce.number(),
  height: z.coerce.number(),
  bodyFat: z.coerce.number().min(0).max(100),
  muscleMass: z.coerce.number(),
  boneWeight: z.coerce.number(),
  waterVolume: z.coerce.number().min(0).max(100),
  visceralFat: z.coerce.number(),
  kcal: z.coerce.number(),
  bodyType: z.coerce.number().int(),
  biologicalAge: z.coerce.number().int(),
  timeAt: DateTransform.optional(),
};

export const CreateHealthIndicatorSchema = BaseCreateSchema.extend(HealthIndicatorFields);

export const UpdateHealthIndicatorSchema = BaseUpdateSchema.extend({
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  bodyFat: z.coerce.number().min(0).max(100).optional(),
  muscleMass: z.coerce.number().optional(),
  boneWeight: z.coerce.number().optional(),
  waterVolume: z.coerce.number().min(0).max(100).optional(),
  visceralFat: z.coerce.number().optional(),
  kcal: z.coerce.number().optional(),
  bodyType: z.coerce.number().int().optional(),
  biologicalAge: z.coerce.number().int().optional(),
  timeAt: DateTransform.optional(),
});

export const HealthIndicatorQuerySchema = BaseQuerySchema.extend({
  userId: z.uuid().optional(),
});

export const HealthIndicatorParamsSchema = BaseParamsSchema;

export type CreateHealthIndicatorDto = z.infer<typeof CreateHealthIndicatorSchema>;
export type UpdateHealthIndicatorDto = z.infer<typeof UpdateHealthIndicatorSchema>;
export type HealthIndicatorQueryDto = z.infer<typeof HealthIndicatorQuerySchema>;
export type HealthIndicatorParamsDto = z.infer<typeof HealthIndicatorParamsSchema>;
export const HealthIndicatorChartQuerySchema = z.object({
  userId: z.uuid().nullish(),
  type: z.enum(HEALTH_INDICATOR_CHART_FIELDS),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});
export type HealthIndicatorChartQueryDto = z.infer<typeof HealthIndicatorChartQuerySchema>;
