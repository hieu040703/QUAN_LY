import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { CheckIn } from "@/database/models/CheckIn";
import { CheckInReportOptions, CheckInService } from "./checkIn.service";
import { CHECK_IN_TYPES } from "./checkIn.types";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "@/shared/types/errors";
import { CheckInTopMembersQueryDto } from "./checkIn.validator";

@injectable()
export class CheckInController extends BaseController<CheckIn> {
  protected service: CheckInService;

  constructor(
    @inject(CHECK_IN_TYPES.CheckInService)
    service: CheckInService,
  ) {
    super();
    this.service = service;
  }

  report = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userContext?.userId ?? req.user?.userId;
      if (!userId) throw new UnauthorizedError("User not authenticated");

      const options = req.query as unknown as CheckInReportOptions;
      const direction = options.direction;
      const result = await this.service.report(options, direction, userId);

      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };

  topMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as unknown as CheckInTopMembersQueryDto;
      const result = await this.service.getTopMembers(query);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };

  paidCheckIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await this.service.paidCheckIn(id);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };

  collectCheckIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const clubId = req.header("x-club-id");
      const result = await this.service.collectCheckIn(id, clubId);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };
}
