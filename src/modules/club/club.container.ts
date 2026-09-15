import { ContainerModule } from "inversify";
import { ClubController } from "./club.controller";
import { ClubRepository } from "./club.repository";
import { ClubRouter } from "./club.route";
import { UserClubRouter } from "./user.route";
import { ManagerClubRouter } from "./manager.route";
import { ClubService } from "./club.service";
import { CLUB_TYPES } from "./club.types";

export const clubModule = new ContainerModule((bind) => {
  bind<ClubRepository>(CLUB_TYPES.ClubRepository).to(ClubRepository);
  bind<ClubService>(CLUB_TYPES.ClubService).to(ClubService);
  bind<ClubController>(CLUB_TYPES.ClubController).to(ClubController);
  bind<ClubRouter>(CLUB_TYPES.ClubRouter).to(ClubRouter);
  bind<UserClubRouter>(CLUB_TYPES.UserClubRouter).to(UserClubRouter);
  bind<ManagerClubRouter>(CLUB_TYPES.ManagerClubRouter).to(ManagerClubRouter);
});
