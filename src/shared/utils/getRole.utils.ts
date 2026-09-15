import DatabaseConfig from "@/config/database";
import { User } from "@/database/models/User";
import { hasPermissionWithFallback, Module, Permission } from "../middleware/permission.middleware";

/** Return users with a system role permission. */
export async function getUserHasPermission(module: Module, permission: Permission): Promise<string[]> {
  const users = await DatabaseConfig.getRepository(User).find({ relations: { role: true } });
  return users
    .filter((user) => user.username === "admin" || hasPermissionWithFallback(user.role?.permissions, module, permission))
    .map((user) => user.id);
}
