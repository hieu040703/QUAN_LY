import { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import { Club } from "@/database/models/Club";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { Booking } from "@/database/models/Booking";
import { CheckIn } from "@/database/models/CheckIn";
import { ClubActivity } from "@/database/models/ClubActivity";
import { UserPacket } from "@/database/models/UserPacket";
import { ClubRole } from "@/database/models/ClubRole";
import { getClubPermissionClubIds } from "./userId.middleware";
import { hasPermissionWithFallback, Module, Permission } from "./permission.middleware";
import { EntityTarget } from "typeorm";
import { z } from "zod";

export const CLUB_MODULES = [
  "booking",
  "club",
  "clubActivity",
  "clubMember",
  "clubRole",
  "userPacket",
  "checkIn",
  "dashboard",
  "user",
] as const;
export type ClubModule = (typeof CLUB_MODULES)[number];

export type PermissionClubStructure = Partial<Record<ClubModule, Permission[]>>;
const setClubIdOnRequest = (req: Request, clubId: string): void => {
  Object.defineProperty(req, "query", {
    value: {
      ...((req.query || {}) as Record<string, unknown>),
      clubId,
      clubIds: [clubId],
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });

  Object.defineProperty(req, "body", {
    value: {
      ...((req.body || {}) as Record<string, unknown>),
      clubId,
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

const setClubIdsOnRequest = (req: Request, clubIds: string[]): void => {
  Object.defineProperty(req, "query", {
    value: {
      ...((req.query || {}) as Record<string, unknown>),
      clubId: undefined,
      clubIds,
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

export type ClubPermissionOptions = {
  verifyResourceClub?: boolean;
};

const clubScopedResourceModels: Partial<Record<ClubModule, EntityTarget<any>>> = {
  booking: Booking,
  checkIn: CheckIn,
  clubActivity: ClubActivity,
  clubMember: ClubMember,
  clubRole: ClubRole,
  userPacket: UserPacket,
};

export const clubPermissionMiddleware = (
  module: ClubModule,
  permission: Permission,
  options: ClubPermissionOptions = {},
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userJwt = req.user as any;
      const userId = userJwt?.userId;
      if (!userId) {
        throw new UnauthorizedError("User not authenticated");
      }

      const headerClubId = req.header("x-club-id")?.trim();
      if (!headerClubId) {
        throw new BadRequestError("x-club-id header is required", "x-club-id");
      }
      if (!z.uuid().safeParse(headerClubId).success) {
        throw new BadRequestError("x-club-id must be a valid UUID", "x-club-id");
      }

      const clubId = headerClubId;
      setClubIdOnRequest(req, clubId);

      if (module === "club" && req.params?.id && req.params.id !== clubId) {
        throw new ForbiddenError("x-club-id does not match the requested club");
      }

      const checkClubPermission = async (): Promise<void> => {
        try {
          const repo = DatabaseConfig.manager;
          const club = await repo.getRepository(Club).findOne({
            where: { id: clubId },
            select: { id: true, isActive: true },
          });
          if (club && !club.isActive) throw new BadRequestError("CLB hiện đang tạm khóa");

          if (options.verifyResourceClub && req.params?.id && module !== "club") {
            const resourceModel = clubScopedResourceModels[module];
            if (resourceModel) {
              const resource = await repo.getRepository(resourceModel).findOne({
                where: { id: req.params.id },
                select: { id: true, clubId: true },
              });

              if (resource && resource.clubId !== clubId) {
                throw new ForbiddenError("Resource does not belong to this club");
              }
            }
          }

          const member = await repo
            .getRepository(ClubMember)
            .findOne({ where: { clubId, userId, status: MemberStatus.ACTIVE } });
          if (!member) throw new BadRequestError("Bạn không phải là thành viên của CLB này!");

          if (member.role === RoleClub.LEADER) return next();

          const clubRoleId = member.clubRoleId;
          if (!clubRoleId) throw new BadRequestError("Bạn không có quyền thao tác này");

          const clubRole = await repo.getRepository(ClubRole).findOneBy({ id: clubRoleId });
          if (!clubRole) throw new BadRequestError("Quyền không tồn tại");

          const clubPermissions = clubRole.permissions as unknown as Partial<Record<Module, Permission[]>>;
          if (hasPermissionWithFallback(clubPermissions, module, permission)) return next();

          throw new ForbiddenError("Insufficient permissions");
        } catch (error) {
          console.error(`Club permission error on module ${module}`, error);
          next(error);
        }
      };

      return void checkClubPermission().catch(next);
    } catch (error) {
      console.error(`Permission error on module ${typeof module === "string" ? module : "[dynamic]"}`, error);
      next(error);
    }
  };
};

export const attachClubIsMiddleware = (
  module: ClubModule,
  permission: Permission,
  options: ClubPermissionOptions = {},
) => {
  const checkHeaderClubPermission = clubPermissionMiddleware(module, permission, options);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const headerClubId = req.header("x-club-id")?.trim();

      if (headerClubId) {
        return checkHeaderClubPermission(req, res, next);
      }

      if (req.method !== "GET" || req.params?.id || options.verifyResourceClub) {
        throw new BadRequestError("x-club-id header is required", "x-club-id");
      }

      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError("User not authenticated");
      }

      const clubIds = await getClubPermissionClubIds(userId);
      setClubIdsOnRequest(req, clubIds);
      next();
    } catch (error) {
      next(error);
    }
  };
};
