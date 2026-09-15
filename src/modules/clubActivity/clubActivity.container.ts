import { ContainerModule } from "inversify";
import { ClubActivityController } from "./clubActivity.controller";
import { ClubActivityRepository } from "./clubActivity.repository";
import { ClubActivityRouter } from "./clubActivity.route";
import { UserClubActivityRouter } from "./user.route";
import { ManagerClubActivityRouter } from "./manager.route";
import { ClubActivityService } from "./clubActivity.service";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";

export const clubActivityModule = new ContainerModule((bind) => {
  bind<ClubActivityRepository>(CLUB_ACTIVITY_TYPES.ClubActivityRepository).to(ClubActivityRepository);
  bind<ClubActivityService>(CLUB_ACTIVITY_TYPES.ClubActivityService).to(ClubActivityService);
  bind<ClubActivityController>(CLUB_ACTIVITY_TYPES.ClubActivityController).to(ClubActivityController);
  bind<ClubActivityRouter>(CLUB_ACTIVITY_TYPES.ClubActivityRouter).to(ClubActivityRouter);
  bind<UserClubActivityRouter>(CLUB_ACTIVITY_TYPES.UserClubActivityRouter).to(UserClubActivityRouter);
  bind<ManagerClubActivityRouter>(CLUB_ACTIVITY_TYPES.ManagerClubActivityRouter).to(ManagerClubActivityRouter);
});
