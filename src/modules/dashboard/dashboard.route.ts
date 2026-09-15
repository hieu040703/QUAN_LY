import { Router } from "express";
import { injectable, inject } from "inversify";
import { DASHBOARD_TYPES } from "./dashboard.types";
import { DashboardController } from "./dashboard.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import {
    DashboardQuerySchema,
    TopCustomerQuerySchema,
    DashboardOverviewQuerySchema,
} from "./dashboard.validator";

@injectable()
export class DashboardRouter {
    private router: Router;

    constructor(
        @inject(DASHBOARD_TYPES.DashboardController)
        protected dashboardController: DashboardController,
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // API duy nhất, gộp toàn bộ số liệu dashboard (kể cả breakdown theo club), lọc qua query string:
        // GET /dashboard/overview?period=30d&clubId=1&status=active
        this.router.get(
            "/overview",
            zodValidate(DashboardOverviewQuerySchema, "query"),
            permissionMiddleware("dashboard", "read"),
            this.dashboardController.getOverview,
        );
        this.router.get(
            "/generalStat",
            zodValidate(DashboardOverviewQuerySchema, "query"),
            permissionMiddleware("dashboard", "read"),
            this.dashboardController.getGeneralStats,
        );
        this.router.get(
            "/club-statistics",
            zodValidate(DashboardOverviewQuerySchema, "query"),
            permissionMiddleware("dashboard", "read"),
            this.dashboardController.getClubStatistics,
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}
