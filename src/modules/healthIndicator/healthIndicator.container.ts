import { ContainerModule } from "inversify";
import { HealthIndicatorController } from "./healthIndicator.controller";
import { HealthIndicatorRepository } from "./healthIndicator.repository";
import { HealthIndicatorRouter } from "./healthIndicator.route";
import { UserHealthIndicatorRouter } from "./user.route";
import { HealthIndicatorService } from "./healthIndicator.service";
import { HEALTH_INDICATOR_TYPES } from "./healthIndicator.types";

export const healthIndicatorModule = new ContainerModule((bind) => {
  bind<HealthIndicatorRepository>(HEALTH_INDICATOR_TYPES.HealthIndicatorRepository).to(HealthIndicatorRepository);
  bind<HealthIndicatorService>(HEALTH_INDICATOR_TYPES.HealthIndicatorService).to(HealthIndicatorService);
  bind<HealthIndicatorController>(HEALTH_INDICATOR_TYPES.HealthIndicatorController).to(HealthIndicatorController);
  bind<HealthIndicatorRouter>(HEALTH_INDICATOR_TYPES.HealthIndicatorRouter).to(HealthIndicatorRouter);
  bind<UserHealthIndicatorRouter>(HEALTH_INDICATOR_TYPES.UserHealthIndicatorRouter).to(UserHealthIndicatorRouter);
});
