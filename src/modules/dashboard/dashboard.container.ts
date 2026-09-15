import { ContainerModule } from "inversify";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "./dashboard.repository";
import { DASHBOARD_TYPES } from "./dashboard.types";
import { DashboardRouter } from "./dashboard.route";
import { DashboardUserRoute } from "@/modules/dashboard/dashboard-user.route";
import { ManagerDashboardRouter } from "./manager.route";

const dashboardModule = new ContainerModule((bind) => {
  bind<DashboardRepository>(DASHBOARD_TYPES.DashboardRepository).to(DashboardRepository);
  bind<DashboardService>(DASHBOARD_TYPES.DashboardService).to(DashboardService);
  bind<DashboardController>(DASHBOARD_TYPES.DashboardController).to(DashboardController);
  bind<DashboardRouter>(DASHBOARD_TYPES.DashboardRouter).to(DashboardRouter);
  bind<ManagerDashboardRouter>(DASHBOARD_TYPES.ManagerDashboardRouter).to(ManagerDashboardRouter);
  bind<DashboardUserRoute>(DASHBOARD_TYPES.DashboardUserRouter).to(DashboardUserRoute);
});

export { dashboardModule };
