import { BaseCreateSchema, BaseParamsSchema, BaseQuerySchema, BaseUpdateSchema } from "@/shared/base/BaseValidator";
import { CLUB_MODULES } from "@/shared/middleware/clubPermission.middleware";
import { PERMISSIONS } from "@/shared/middleware/permission.middleware";
import { z } from "zod";

const ClubPermissionStructureSchema = z.record(z.string().trim(), z.array(z.string().trim()));

function sanitizeClubPermissions(permissions?: Record<string, string[]>): Record<string, string[]> | undefined {
  if (!permissions) return undefined;

  const result: Record<string, string[]> = {};

  for (const moduleKey of Object.keys(permissions)) {
    if (!CLUB_MODULES.includes(moduleKey as (typeof CLUB_MODULES)[number])) {
      continue;
    }

    const filtered = permissions[moduleKey].filter((permission) =>
      PERMISSIONS.includes(permission as (typeof PERMISSIONS)[number]),
    );

    if (filtered.length > 0) {
      result[moduleKey] = filtered;
    }
  }

  return result;
}

export const CreateClubRoleSchema = BaseCreateSchema.extend({
  name: z.string().trim().min(1).max(255),
  permissions: ClubPermissionStructureSchema.optional(),
  clubId: z.uuid(),
}).transform((data) => ({
  ...data,
  permissions: sanitizeClubPermissions(data.permissions),
}));

export const UpdateClubRoleSchema = BaseUpdateSchema.extend({
  name: z.string().trim().min(1).max(255).optional(),
  permissions: ClubPermissionStructureSchema.optional(),
}).transform((data) => ({
  ...data,
  permissions: sanitizeClubPermissions(data.permissions),
}));

export const ClubRoleQuerySchema = BaseQuerySchema;
export const ClubRoleParamsSchema = BaseParamsSchema;

export type CreateClubRoleDto = z.infer<typeof CreateClubRoleSchema>;
export type UpdateClubRoleDto = z.infer<typeof UpdateClubRoleSchema>;
export type ClubRoleQueryDto = z.infer<typeof ClubRoleQuerySchema>;
export type ClubRoleParamsDto = z.infer<typeof ClubRoleParamsSchema>;
