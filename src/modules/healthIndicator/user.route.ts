import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { HealthIndicatorController } from "./healthIndicator.controller";
import { HEALTH_INDICATOR_TYPES } from "./healthIndicator.types";
import {
  CreateHealthIndicatorSchema,
  HealthIndicatorChartQuerySchema,
  HealthIndicatorParamsSchema,
  HealthIndicatorQuerySchema,
  UpdateHealthIndicatorSchema,
} from "./healthIndicator.validator";

@injectable()
export class UserHealthIndicatorRouter {
  private router: Router;

  constructor(
    @inject(HEALTH_INDICATOR_TYPES.HealthIndicatorController)
    private controller: HealthIndicatorController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(HealthIndicatorQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.get("/chart", zodValidate(HealthIndicatorChartQuerySchema, "query"), this.controller.getChartData);
    this.router.post("/", zodValidate(CreateHealthIndicatorSchema, "body"), this.controller.create);
    this.router.put(
      "/:id",
      zodValidate(HealthIndicatorParamsSchema, "params"),
      zodValidate(UpdateHealthIndicatorSchema, "body"),
      this.controller.update,
    );
    this.router.delete("/:id", zodValidate(HealthIndicatorParamsSchema, "params"), this.controller.delete);
  }

  getRouter(): Router {
    return this.router;
  }
}
