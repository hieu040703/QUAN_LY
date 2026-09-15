import { AttributeTypeEnum } from "@/database/models/Attribute";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import * as z from "zod";

export const CreateAttributeSchema = BaseCreateSchema.extend({
  name: z.string().trim(),
  type: z.enum(AttributeTypeEnum),
});

export const UpdateAttributeSchema = BaseUpdateSchema.extend({
  name: z.string().trim().optional(),
});

export const AttributeQuerySchema = z.object({
  type: z.enum(AttributeTypeEnum),
});

export const AttributeParamsSchema = BaseParamsSchema;

export type CreateAttributeDto = z.infer<typeof CreateAttributeSchema>;
export type UpdateAttributeDto = z.infer<typeof UpdateAttributeSchema>;
export type AttributeQueryDto = z.infer<typeof AttributeQuerySchema>;
export type AttributeParamsDto = z.infer<typeof AttributeParamsSchema>;
