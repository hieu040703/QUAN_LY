import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { HealthIndicator } from "@/database/models/HealthIndicator";
import { HealthIndicatorService } from "./healthIndicator.service";
import { HEALTH_INDICATOR_TYPES } from "./healthIndicator.types";
import { HealthIndicatorChartQueryDto } from "./healthIndicator.validator";
@injectable()
export class HealthIndicatorController extends BaseController<HealthIndicator> {
  protected service: HealthIndicatorService;

  constructor(
    @inject(HEALTH_INDICATOR_TYPES.HealthIndicatorService)
    service: HealthIndicatorService,
  ) {
    super();
    this.service = service;
  }
  getChartData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, type, limit } = req.query as unknown as HealthIndicatorChartQueryDto;
      const uId = userId || req.userContext?.userId || req.user?.userId;
      const data = await this.service.getChartData(uId!, type, limit || 6);
      return this.sendResponse({
        res,
        data,
        message: "Fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  // getSummary = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const userId = (req.userContext?.userId ?? req.user?.userId) as string;
  //     const summary = await this.service.getSummary(userId);
  //     return this.sendResponse({
  //       res,
  //       data: summary,
  //       message: "Fetched successfully",
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // };

  getAllWithPagination = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.userContext?.userId ?? req.user?.userId) as string;
      const summary = await this.service.getSummary(userId);
      const reqContext = this.service.getReqContext(req);
      const result = await this.service.findAllWithPagination(req.query, undefined, req);
      await this.service.hydrateEntities(result.data, reqContext);
      return res.status(result.statusCode).json({ ...result, current: summary });
    } catch (error) {
      next(error);
    }
  };
}
