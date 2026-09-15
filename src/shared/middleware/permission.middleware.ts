/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../types/errors";

/**
 * =========================
 * MODULE DEFINITIONS
 * =========================
 */
export const MODULES = [
  // ===== System / access control =====
  "permission",
  "user",
  "log",

  // ===== Fitness club =====
  "booking",
  "checkIn",
  "club",
  "clubActivity",
  "clubMember",
  "clubRole",
  "healthIndicator",
  "packet",
  "userPacket",
  "userPacketLine",
  "userTarget",

  // ===== Messaging =====
  "chat",
  "seenMessage",

  // ===== Device (FCM) =====
  "device",
  "dashboard",
] as const;

export type Module = (typeof MODULES)[number];

/**
 * =========================
 * PERMISSIONS
 * =========================
 */
export const PERMISSIONS = ["create", "read", "update", "confirm", "approve", "delete", "block", "kick"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type PermissionStructure = {
  [key in Module]?: Permission[];
};

/**
 * Các module chỉ có quyền read theo từng context
 */
export const ReadOnlyModules: Module[] = [
  // Audit logs are intentionally read-only.
  "log",
  "dashboard",
];

/**
 * Các module cần quyền confirm
 */
export const ConfirmModules: Module[] = [];

/**
 * Các module cần quyền approve
 */
export const ApprovalModules: Module[] = ["booking", "clubMember"];

export const BlockModules: Module[] = ["clubMember", "club"];

export const KickModules: Module[] = ["clubMember"];

export const readPermissionFallbackMap: Partial<Record<Module, Module[]>> = {
  permission: ["user"],
  user: ["checkIn", "booking", "club", "userPacket", "clubMember"],
  club: ["booking", "userPacket", "checkIn"],
  clubRole: ["club", "clubMember"],
};

export const hasPermissionWithFallback = (
  permissions?: Partial<Record<Module, Permission[]>>,
  module?: Module,
  permission: Permission = "read",
): boolean => {
  if (!module || !permissions) return false;

  const modulePermissions = permissions[module] || [];
  if (modulePermissions.includes(permission)) return true;

  if (permission !== "read") return false;

  const fallbackModules = readPermissionFallbackMap[module] || [];
  return fallbackModules.some((fallbackModule) => permissions[fallbackModule]?.includes("create"));
};

/**
 *
 * @param module
 * @param permission
 * @returns
 */
export const permissionMiddleware = (
  module: Module | ((req: Request) => Module),
  permission: Permission,
  _allowCustomer?: boolean,
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userJwt = req.user as any;
      if (!userJwt?.userId) {
        throw new UnauthorizedError("User not authenticated");
      }

      if (userJwt.username === "admin") return next();

      const resolvedModule = typeof module === "function" ? module(req) : module;

      const permissions = req.permissions || {};
      if (hasPermissionWithFallback(permissions, resolvedModule, permission)) {
        return next();
      }

      throw new ForbiddenError("Insufficient permissions");
    } catch (error) {
      console.error(`Permission error on module ${typeof module === "string" ? module : "[dynamic]"}`, error);
      next(error);
    }
  };
};

export function createPermissions(mode: "empty" | "full" = "full"): PermissionStructure {
  const permissions: PermissionStructure = {};

  for (const m of MODULES) {
    if (mode === "empty") {
      permissions[m] = [];
      continue;
    }

    // full
    if (ReadOnlyModules.includes(m)) {
      permissions[m] = ["read"];
    } else {
      permissions[m] = ["create", "read", "update", "delete"];
    }

    if (ConfirmModules.includes(m)) {
      permissions[m].push("confirm");
    }

    if (ApprovalModules.includes(m)) {
      permissions[m].push("approve");
    }

    if (BlockModules.includes(m)) {
      permissions[m].push("block");
    }

    if (KickModules.includes(m)) {
      permissions[m].push("kick");
    }
  }

  return permissions;
}
