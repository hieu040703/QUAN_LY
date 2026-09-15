import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { DashboardController } from "./dashboard.controller";
import { DASHBOARD_TYPES } from "./dashboard.types";
import { DashboardOverviewQuerySchema } from "./dashboard.validator";

@injectable()
export class ManagerDashboardRouter {
  private readonly router: Router;

  constructor(@inject(DASHBOARD_TYPES.DashboardController) private readonly controller: DashboardController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    const managerDashboardPermission = attachClubIsMiddleware("dashboard", "read");

    this.router.get(
      "/overview",
      managerDashboardPermission,
      zodValidate(DashboardOverviewQuerySchema, "query"),
      this.controller.getOverview,
    );

    this.router.get(
      "/generalStat",
      managerDashboardPermission,
      zodValidate(DashboardOverviewQuerySchema, "query"),
      this.controller.getGeneralStats,
    );
    this.router.get(
      "/club-statistics",
      managerDashboardPermission,
      zodValidate(DashboardOverviewQuerySchema, "query"),
      this.controller.getClubStatistics,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
