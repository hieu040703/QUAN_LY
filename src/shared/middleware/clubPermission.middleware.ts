import { Request, Response, NextFunction } from "express";
import { Module, Permission, permissionMiddleware } from "./permission.middleware";

/** Compatibility wrappers kept while new domain modules are introduced. */
export const CLUB_MODULES = ["user", "role", "notification", "device", "file", "log"] as const;
export type ClubModule = Module;
export type PermissionClubStructure = Partial<Record<Module, Permission[]>>;
export type ClubPermissionOptions = { verifyResourceClub?: boolean };

export const clubPermissionMiddleware = (
  module: ClubModule,
  permission: Permission,
  _options: ClubPermissionOptions = {},
) => permissionMiddleware(module, permission);

export const attachClubIsMiddleware = (
  module: ClubModule,
  permission: Permission,
  _options: ClubPermissionOptions = {},
) => (req: Request, res: Response, next: NextFunction) =>
  permissionMiddleware(module, permission)(req, res, next);
