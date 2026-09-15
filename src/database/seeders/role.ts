import { createPermissions } from "@/shared/middleware/permission.middleware";
import { Role } from "../models/Role";

export const roleSeeder: Partial<Role>[] = [
  {
    name: "Quản trị viên",
    permissions: createPermissions(),
    isDefault: true,
  },
  {
    name: "Nhân viên",
    permissions: createPermissions("empty"),
    isDefault: true,
  },
];
