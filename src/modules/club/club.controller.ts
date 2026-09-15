import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Club } from "@/database/models/Club";
import { ClubService } from "./club.service";
import { CLUB_TYPES } from "./club.types";
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class ClubController extends BaseController<Club> {
  protected service: ClubService;

  constructor(
    @inject(CLUB_TYPES.ClubService)
    service: ClubService,
  ) {
    super();
    this.service = service;
  }

  getMyClub = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqContext = this.service.getReqContext(req);

      const userId = req.userContext?.userId || req.user?.userId;
      if (!userId) throw new BadRequestError("Yêu cầu đăng nhập");

      const query = req.query;
      const result = await this.service.findAllWithPagination({
        ...query,
        userId,
        isManager: true,
        isMine: true,
      } as any);
      await this.service.hydrateEntities(result.data, reqContext);

      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateIsActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clubId = req.params.id;
      const isActive = req.body.isActive;
      const result = await this.service.updateIsActive(clubId, isActive);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };
}
