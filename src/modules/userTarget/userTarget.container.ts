import { ContainerModule } from "inversify";
import { UserTargetController } from "./userTarget.controller";
import { UserTargetRepository } from "./userTarget.repository";
import { UserTargetRouter } from "./userTarget.route";
import { UserUserTargetRouter } from "./user.route";
import { UserTargetService } from "./userTarget.service";
import { USER_TARGET_TYPES } from "./userTarget.types";

export const userTargetModule = new ContainerModule((bind) => {
  bind<UserTargetRepository>(USER_TARGET_TYPES.UserTargetRepository).to(UserTargetRepository);
  bind<UserTargetService>(USER_TARGET_TYPES.UserTargetService).to(UserTargetService);
  bind<UserTargetController>(USER_TARGET_TYPES.UserTargetController).to(UserTargetController);
  bind<UserTargetRouter>(USER_TARGET_TYPES.UserTargetRouter).to(UserTargetRouter);
  bind<UserUserTargetRouter>(USER_TARGET_TYPES.UserUserTargetRouter).to(UserUserTargetRouter);
});
