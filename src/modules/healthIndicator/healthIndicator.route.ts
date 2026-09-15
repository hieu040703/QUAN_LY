import { Router, Request, Response, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { HealthIndicatorController } from "./healthIndicator.controller";
import { HEALTH_INDICATOR_TYPES } from "./healthIndicator.types";
import { authenticate, authorization } from "@/shared/middleware/auth.middleware";
import { UnauthorizedError } from "@/shared/types/errors";

import {
  CreateHealthIndicatorSchema,
  HealthIndicatorChartQuerySchema,
  HealthIndicatorParamsSchema,
  HealthIndicatorQuerySchema,
  UpdateHealthIndicatorSchema,
} from "./healthIndicator.validator";

@injectable()
export class HealthIndicatorRouter {
  private router: Router;

  constructor(
    @inject(HEALTH_INDICATOR_TYPES.HealthIndicatorController)
    private controller: HealthIndicatorController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }
  private attachUserId = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userContext?.userId ?? req.user?.userId;
    if (!userId) return next(new UnauthorizedError("User not authenticated"));
    req.body.userId = userId;
    next();
  };
  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(HealthIndicatorQuerySchema, "query"),
      permissionMiddleware("healthIndicator", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.get(
      "/chart",
      zodValidate(HealthIndicatorChartQuerySchema, "query"),
      permissionMiddleware("healthIndicator", "read"),
      this.controller.getChartData,
    );
    // this.router.get(
    //     "/summary",
    //     permissionMiddleware("healthIndicator", "read"),
    //     this.controller.getSummary,
    // );
    this.router.post(
      "/",
      zodValidate(CreateHealthIndicatorSchema, "body"),
      this.attachUserId,
      permissionMiddleware("healthIndicator", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(HealthIndicatorParamsSchema, "params"),
      permissionMiddleware("healthIndicator", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(HealthIndicatorParamsSchema, "params"),
      zodValidate(UpdateHealthIndicatorSchema, "body"),
      permissionMiddleware("healthIndicator", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(HealthIndicatorParamsSchema, "params"),
      permissionMiddleware("healthIndicator", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
