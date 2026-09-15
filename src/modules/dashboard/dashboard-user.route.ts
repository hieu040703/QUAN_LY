import {Router} from "express";
import {injectable, inject} from "inversify";
import {DASHBOARD_TYPES} from "./dashboard.types";
import {DashboardController} from "./dashboard.controller";

@injectable()
export class DashboardUserRoute {
    private router: Router;

    constructor(
        @inject(DASHBOARD_TYPES.DashboardController)
        protected dashboardController: DashboardController,
    ) {
        this.router = Router();
        this.initializeRoutes();
    }
    private initializeRoutes(): void {
        this.router.get("/", this.dashboardController.getMemberOverview);
    }
    public getRouter(): Router {
        return this.router;
    }
}