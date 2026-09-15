import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../types/errors";
import { Module, Permission, hasPermissionWithFallback } from "./permission.middleware";

export type UserIdTarget = "body" | "query" | "both";
export type AttachUserIdOptions = { attachUserIdWhenHasPermission?: boolean };

const setRequestData = (req: Request, target: "body" | "query", data: Record<string, unknown>): void => {
  Object.defineProperty(req, target, {
    value: data,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const setUserId = (req: Request, target: "body" | "query", userId: string): void => {
  setRequestData(req, target, { ...((req[target] || {}) as Record<string, unknown>), userId });
};

const hasSystemPermission = (req: Request, module: Module, permission: Permission): boolean => {
  if (req.user?.username === "admin") return true;
  return hasPermissionWithFallback(req.permissions, module, permission);
};

export const attachUserIdIfNoPermission = (
  module: Module,
  permission: Permission = "read",
  target: UserIdTarget = "both",
  options: AttachUserIdOptions = {},
) => (req: Request, _res: Response, next: NextFunction): void => {
  const userId = req.userContext?.userId ?? req.user?.userId;
  if (!userId) {
    next(new UnauthorizedError("User not authenticated"));
    return;
  }

  const canSelectOtherUser = hasSystemPermission(req, module, permission);
  const addFor = (scope: "body" | "query") => {
    const current = req[scope] as Record<string, unknown> | undefined;
    const hasUserId = typeof current?.userId === "string" && current.userId.trim().length > 0;
    if (!canSelectOtherUser || (options.attachUserIdWhenHasPermission !== false && !hasUserId)) {
      setUserId(req, scope, userId);
    }
  };

  if (target === "body" || target === "both") addFor("body");
  if (target === "query" || target === "both") addFor("query");
  next();
};

export const attachUserIdFromAuth = attachUserIdIfNoPermission;

export const attachUserIdFromAuthToQueryAndBody = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = req.userContext?.userId ?? req.user?.userId;
  if (!userId) {
    next(new UnauthorizedError("User not authenticated"));
    return;
  }
  setUserId(req, "query", userId);
  setUserId(req, "body", userId);
  next();
};
