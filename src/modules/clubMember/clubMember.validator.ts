import { MemberStatus, RoleClub } from "@/database/models/ClubMember";
import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseQuerySchema,
  BaseUpdateSchema,
  zArrayable,
  zBooleanLike,
} from "@/shared/base/BaseValidator";
import { z } from "zod";

export const CreateClubMemberSchema = BaseCreateSchema.extend({
  clubId: z.uuid(),
  userId: z.uuid(),
  clubRoleId: z.uuid().nullish(),
  memberNote: z.string().trim().nullish(),
});

export const UpdateClubMemberSchema = BaseUpdateSchema.extend({
  clubRoleId: z.uuid().nullish(),
  memberNote: z.string().trim().nullish(),
});

export const ClubMemberQuerySchema = BaseQuerySchema.extend({
  clubId: z.uuid().optional(),
  userId: z.uuid().optional(),
  packetId: z.uuid().optional(),
  clubMemberIds: zArrayable(z.uuid()).optional(),
  role: z.enum(RoleClub).optional(),
  birthdayInMonth: z.coerce.number().int().min(1).max(12).optional(),
});

export const ClubMemberParamsSchema = BaseParamsSchema;
export const UpdateMemberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus),
  memberNote: z.string().trim().nullish(),
});

export type CreateClubMemberDto = z.infer<typeof CreateClubMemberSchema>;
export type UpdateClubMemberDto = z.infer<typeof UpdateClubMemberSchema>;
export type ClubMemberQueryDto = z.infer<typeof ClubMemberQuerySchema>;
export type ClubMemberParamsDto = z.infer<typeof ClubMemberParamsSchema>;
export type UpdateMemberStatusDto = z.infer<typeof UpdateMemberStatusSchema>;
