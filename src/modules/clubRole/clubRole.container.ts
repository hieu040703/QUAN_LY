import { ContainerModule } from "inversify";
import { ClubRoleController } from "./clubRole.controller";
import { ClubRoleRepository } from "./clubRole.repository";
import { ClubRoleRouter } from "./clubRole.route";
import { ManagerClubRoleRouter } from "./manager.route";
import { ClubRoleService } from "./clubRole.service";
import { CLUB_ROLE_TYPES } from "./clubRole.types";

export const clubRoleModule = new ContainerModule((bind) => {
  bind<ClubRoleRepository>(CLUB_ROLE_TYPES.ClubRoleRepository).to(ClubRoleRepository);
  bind<ClubRoleService>(CLUB_ROLE_TYPES.ClubRoleService).to(ClubRoleService);
  bind<ClubRoleController>(CLUB_ROLE_TYPES.ClubRoleController).to(ClubRoleController);
  bind<ClubRoleRouter>(CLUB_ROLE_TYPES.ClubRoleRouter).to(ClubRoleRouter);
  bind<ManagerClubRoleRouter>(CLUB_ROLE_TYPES.ManagerClubRoleRouter).to(ManagerClubRoleRouter);
});
