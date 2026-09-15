import { ContainerModule } from "inversify";
import { CheckInController } from "./checkIn.controller";
import { CheckInRepository } from "./checkIn.repository";
import { CheckInRouter } from "./checkIn.route";
import { UserCheckInRouter } from "./user.route";
import { ManagerCheckInRouter } from "./manager.route";
import { CheckInService } from "./checkIn.service";
import { CHECK_IN_TYPES } from "./checkIn.types";

export const checkInModule = new ContainerModule((bind) => {
  bind<CheckInRepository>(CHECK_IN_TYPES.CheckInRepository).to(CheckInRepository);
  bind<CheckInService>(CHECK_IN_TYPES.CheckInService).to(CheckInService);
  bind<CheckInController>(CHECK_IN_TYPES.CheckInController).to(CheckInController);
  bind<CheckInRouter>(CHECK_IN_TYPES.CheckInRouter).to(CheckInRouter);
  bind<UserCheckInRouter>(CHECK_IN_TYPES.UserCheckInRouter).to(UserCheckInRouter);
  bind<ManagerCheckInRouter>(CHECK_IN_TYPES.ManagerCheckInRouter).to(ManagerCheckInRouter);
});
