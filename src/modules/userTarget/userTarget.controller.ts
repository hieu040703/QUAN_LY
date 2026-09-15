import { injectable, inject } from "inversify";
import { Request, Response, NextFunction } from "express";
import { BaseController } from "@/shared/base/BaseController";
import { IFindOptions } from "@/shared/base/BaseService";
import { UserTarget } from "@/database/models/UserTarget";
import { UserTargetService } from "./userTarget.service";
import { USER_TARGET_TYPES } from "./userTarget.types";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { ProgressGroupBy } from "./userTarget.progress.util";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class UserTargetController extends BaseController<UserTarget> {
  protected service: UserTargetService;

  constructor(
    @inject(USER_TARGET_TYPES.UserTargetService)
    service: UserTargetService,
  ) {
    super();
    this.service = service;
  }
  getAllWithPagination = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userContext?.userId || req.user?.userId;
      if (!userId) throw new BadRequestError("Cần xác thực đăng nhập");
      const query = {
        ...req.query,
        userId,
      } as unknown as IFindOptions<UserTarget>;
      const [summary, achievements] = await Promise.all([
        this.service.getSummary(userId),
        this.service.getAchievements(userId),
      ]);
      const reqContext = this.service.getReqContext(req);
      const result = await this.service.findAllWithPagination(query, undefined, reqContext);
      await this.service.hydrateEntities(result.data, reqContext);
      return res.status(result.statusCode).json({ ...result, current: summary, achievements });
    } catch (error) {
      next(error);
    }
  };
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getSummary(req.params.id);
      res.json(ApiResponseHandler.getSuccess("OK", summary));
    } catch (err) {
      next(err);
    }
  };
}
