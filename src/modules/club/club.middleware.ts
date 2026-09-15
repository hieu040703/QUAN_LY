import { NextFunction, Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "@/shared/types/errors";
import DatabaseConfig from "@/config/database";
import { Club } from "@/database/models/Club";

/**
 * Gán người dùng hiện tại làm leader khi tạo CLB.
 * Giá trị leaderId từ client luôn bị ghi đè để tránh giả mạo leader.
 */
export const attachLeaderIdFromAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const userId = req.userContext?.userId ?? req.user?.userId;
  const isLeader = req.userContext?.userSnapshot.isLeader;
  if (!userId) {
    next(new UnauthorizedError("User not authenticated"));
    return;
  }

  if (!isLeader) {
    next(new UnauthorizedError("Bạn không có quyền tạo CLB!"));
    return;
  }

  const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
  req.body = { ...body, leaderId: userId };

  next();
};

export const checkLeaderClub = async (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.userContext?.userId ?? req.user?.userId;
  const id = req.params.id;
  if (!id) throw new BadRequestError("Thiếu thông tin id");

  const club = await DatabaseConfig.manager.getRepository(Club).findOneBy({ id });
  if (!club) throw new BadRequestError("CLB không tồn tại!");

  if (club.leaderId !== userId) throw new BadRequestError("Bạn không phải là chủ tịch CLB");
  next();
};
