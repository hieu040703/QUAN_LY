/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../types/errors";

export const MODULES = ["permission", "user", "role", "notification", "device", "file", "log", "seenMessage"] as const;
export type Module = (typeof MODULES)[number];

export const PERMISSIONS = ["create", "read", "update", "confirm", "approve", "delete", "block", "kick"] as const;
export type Permission = (typeof PERMISSIONS)[number];
export type PermissionStructure = Partial<Record<Module, Permission[]>>;

export const ReadOnlyModules: Module[] = ["log"];
export const ConfirmModules: Module[] = [];
export const ApprovalModules: Module[] = [];
export const BlockModules: Module[] = [];
export const KickModules: Module[] = [];

export const readPermissionFallbackMap: Partial<Record<Module, Module[]>> = {
  permission: ["user", "role"],
};

export const hasPermissionWithFallback = (
  permissions?: Partial<Record<Module, Permission[]>>,
  module?: Module,
  permission: Permission = "read",
): boolean => {
  if (!module || !permissions) return false;
  if (permissions[module]?.includes(permission)) return true;
  if (permission !== "read") return false;
  return (readPermissionFallbackMap[module] || []).some((fallback) => permissions[fallback]?.includes("create"));
};

export const permissionMiddleware = (
  module: Module | ((req: Request) => Module),
  permission: Permission,
  _allowCustomer?: boolean,
) => (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user?.userId) throw new UnauthorizedError("User not authenticated");
    if (req.user.username === "admin") {
      next();
      return;
    }
    const resolvedModule = typeof module === "function" ? module(req) : module;
    if (!hasPermissionWithFallback(req.permissions, resolvedModule, permission)) {
      throw new ForbiddenError("Insufficient permissions");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export function createPermissions(mode: "empty" | "full" = "full"): PermissionStructure {
  const permissions: PermissionStructure = {};
  for (const module of MODULES) {
    permissions[module] = mode === "empty"
      ? []
      : ReadOnlyModules.includes(module)
        ? ["read"]
        : ["create", "read", "update", "delete"];
  }
  return permissions;
}
