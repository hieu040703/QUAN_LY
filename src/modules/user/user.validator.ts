import { z } from "zod";
import {
  BaseQuerySchema,
  BaseParamsSchema,
  BaseCreateSchema,
  BaseUpdateSchema,
  AddressSchema,
  DateTransform,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { GenderEnum } from "@/shared/constants/enum";

export const CreateUserSchema = BaseCreateSchema.extend({
  code: z.string().trim().nonempty().max(50),
  roleId: z.uuid().nullish(),
  username: z.string().trim().min(6).max(100),
  password: z.string().trim().min(6).max(255),
  address: AddressSchema.nullish(),
  gender: z.enum(GenderEnum),
  dob: DateTransform.nullish(),
  name: z.string(),
  phone: z.string().trim().nullish(),
  email: z.string().trim().nullish(),
});

export const UpdateUserSchema = BaseUpdateSchema.extend({
  roleId: z.uuid().nullish(),
  address: AddressSchema.nullish(),
  isActive: z.boolean().optional(),
  gender: z.enum(GenderEnum).optional(),
  name: z.string().optional(),
  dob: DateTransform.nullish(),
  phone: z.string().trim().nullish(),
  email: z.string().trim().nullish(),
});

export const UserQuerySchema = BaseQuerySchema.extend({
  code: z.string().trim().optional(),
  isManager: zBooleanLike().optional(),
});

export const UserParamsSchema = BaseParamsSchema;

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
export type UserParamsDto = z.infer<typeof UserParamsSchema>;
