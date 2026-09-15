import {
  BaseCreateSchema,
  BaseParamsSchema,
  BaseUpdateSchema,
} from "@/shared/base/BaseValidator";
import { z } from "zod";
import {
  MODULES,
  PERMISSIONS,
  ReadOnlyModules,
} from "../../shared/middleware/permission.middleware";

function sanitizePermissions(permissions?: Record<string, string[]>) {
  if (!permissions) return {};

  const result: Record<string, string[]> = {};

  for (const moduleKey of Object.keys(permissions)) {
    // module không hợp lệ
    if (!MODULES.includes(moduleKey as any)) continue;

    const perms = permissions[moduleKey] || [];

    // lọc permission hợp lệ
    const filtered = perms.filter((p) => PERMISSIONS.includes(p as any));

    // module readonly
    if (ReadOnlyModules?.includes(moduleKey as any)) {
      if (filtered.includes("read")) {
        result[moduleKey] = ["read"];
      } else {
        result[moduleKey] = [];
      }
      continue;
    }

    if (filtered.length > 0) {
      result[moduleKey] = filtered;
    }
  }
  return result;
}

// Schema validate toàn bộ permissions structure
const PermissionStructureSchema = z.record(
  z.string().trim(),
  z.array(z.string().trim()),
);

export const CreateRoleSchema = BaseCreateSchema.extend({
  name: z.string().trim().nonempty(),
  permissions: PermissionStructureSchema.optional(),
}).transform((data) => {
  return {
    ...data,
    permissions: sanitizePermissions(data.permissions),
  };
});

export const UpdateRoleSchema = BaseUpdateSchema.extend({
  name: z.string().trim().optional(),
  permissions: PermissionStructureSchema.optional(),
}).transform((data) => {
  return {
    ...data,
    permissions: sanitizePermissions(data.permissions),
  };
});

export const RoleQuerySchema = z.object({});

export const RoleParamsSchema = BaseParamsSchema;

export type CreateRoleDto = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleDto = z.infer<typeof UpdateRoleSchema>;
export type RoleQueryDto = z.infer<typeof RoleQuerySchema>;
export type RoleParamsDto = z.infer<typeof RoleParamsSchema>;
