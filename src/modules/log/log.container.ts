import { ContainerModule } from "inversify";
import { LOG_TYPES } from "./log.types";
import { LogRepository } from "./log.repository";
import { LogService } from "./log.service";
import { LogController } from "./log.controller";
import { LogRouter } from "./log.route";

const logModule = new ContainerModule((bind) => {
  bind<LogRepository>(LOG_TYPES.LogRepository).to(LogRepository);
  bind<LogService>(LOG_TYPES.LogService).to(LogService);
  bind<LogController>(LOG_TYPES.LogController).to(LogController);
  bind<LogRouter>(LOG_TYPES.LogRouter).to(LogRouter);
});

export { logModule };
