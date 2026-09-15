import { NextFunction, Request, Response } from "express";
import { In } from "typeorm";
import DatabaseConfig from "@/config/database";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { ClubRole } from "@/database/models/ClubRole";
import { UnauthorizedError } from "../types/errors";
import { hasPermissionWithFallback, Module, Permission } from "./permission.middleware";

export type UserIdTarget = "body" | "query" | "both";

export type AttachUserIdOptions = {
  attachUserIdWhenHasPermission?: boolean;
};

const getClubId = (req: Request): string | undefined => {
  const clubId = req.query?.clubId ?? req.body?.clubId ?? req.params?.clubId;
  return typeof clubId === "string" && clubId.trim() ? clubId : undefined;
};

const hasSystemPermission = (req: Request, module: Module, permission: Permission): boolean => {
  if (req.user?.username === "admin") return true;
  return Boolean(req.permissions?.[module]?.includes(permission));
};

export const getClubPermissionClubIds = async (
  userId: string,
  module?: Module,
  permission: Permission = "read",
): Promise<string[]> => {
  const memberRepository = DatabaseConfig.manager.getRepository(ClubMember);
  const roleRepository = DatabaseConfig.manager.getRepository(ClubRole);
  const members = await memberRepository.find({
    where: { userId, status: MemberStatus.ACTIVE },
  });

  if (!members.length) return [];

  const roleIds = [...new Set(members.map((member) => member.clubRoleId).filter((id): id is string => Boolean(id)))];
  const roles = roleIds.length ? await roleRepository.find({ where: { id: In(roleIds) } }) : [];
  const roleClubIds = new Set(
    roles
      .filter((role) => {
        const permissions = role.permissions as Partial<Record<Module, Permission[]>> | undefined;
        if (!module) {
          return Object.values(permissions ?? {}).some(
            (modulePermissions) => Array.isArray(modulePermissions) && modulePermissions.length > 0,
          );
        }
        return hasPermissionWithFallback(permissions, module, permission);
      })
      .map((role) => role.clubId),
  );

  return [
    ...new Set(
      members
        .filter((member) => member.role === RoleClub.LEADER || roleClubIds.has(member.clubId))
        .map((member) => member.clubId),
    ),
  ];
};

const hasPermission = async (
  req: Request,
  module: Module,
  permission: Permission,
  permittedClubIds?: string[],
): Promise<boolean> => {
  if (hasSystemPermission(req, module, permission)) return true;

  const clubId = getClubId(req);
  if (!clubId) return false;

  const userId = req.userContext?.userId ?? req.user?.userId;
  if (!userId) return false;

  const clubIds = permittedClubIds ?? (await getClubPermissionClubIds(userId, module, permission));
  return clubIds.includes(clubId);
};

const setRequestData = (req: Request, target: Exclude<UserIdTarget, "both">, data: Record<string, unknown>): void => {
  Object.defineProperty(req, target, {
    value: data,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const setUserId = (req: Request, target: Exclude<UserIdTarget, "both">, userId: string): void => {
  const currentData = (req[target] || {}) as Record<string, unknown>;
  setRequestData(req, target, { ...currentData, userId });
};

const setClubIds = (req: Request, target: Exclude<UserIdTarget, "both">, clubIds: string[]): void => {
  const currentData = (req[target] || {}) as Record<string, unknown>;
  setRequestData(req, target, { ...currentData, clubIds });
};

const hasUserId = (data: unknown): boolean => {
  const userId = (data as { userId?: unknown } | null | undefined)?.userId;
  if (typeof userId === "string") return userId.trim().length > 0;
  return userId !== undefined && userId !== null;
};

export const attachUserIdIfNoPermission = (
  module: Module,
  permission: Permission = "read",
  target: UserIdTarget = "both",
  options: AttachUserIdOptions = {},
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userContext?.userId ?? req.user?.userId;
      if (!userId) {
        next(new UnauthorizedError("User not authenticated"));
        return;
      }

      // Có quyền hệ thống thì không giới hạn theo user/CLB tại middleware này.
      if (hasSystemPermission(req, module, permission)) {
        next();
        return;
      }

      const permittedClubIds = await getClubPermissionClubIds(userId, module, permission);
      const clubId = getClubId(req);

      // Không truyền clubId: giới hạn dữ liệu vào các CLB mà user có quyền.
      if (!clubId && permittedClubIds.length > 0) {
        setClubIds(req, "query", permittedClubIds);
        next();
        return;
      }

      const canSelectOtherUser = await hasPermission(req, module, permission, permittedClubIds);
      const shouldAttachAuthUser = (scope: Exclude<UserIdTarget, "both">): boolean => {
        const currentData = scope === "body" ? req.body : req.query;
        return !canSelectOtherUser || (options.attachUserIdWhenHasPermission !== false && !hasUserId(currentData));
      };

      if ((target === "body" || target === "both") && shouldAttachAuthUser("body")) {
        setUserId(req, "body", userId);
      }
      if ((target === "query" || target === "both") && shouldAttachAuthUser("query")) {
        setUserId(req, "query", userId);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const attachUserIdFromAuth = attachUserIdIfNoPermission;
/**
 * Luôn gắn userId của tài khoản đăng nhập vào cả query và body.
 * Giá trị userId do client truyền lên sẽ bị ghi đè.
 */
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
