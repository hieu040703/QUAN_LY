import { ContainerModule } from "inversify";
import { ClubMemberController } from "./clubMember.controller";
import { ClubMemberRepository } from "./clubMember.repository";
import { ClubMemberRouter } from "./clubMember.route";
import { UserClubMemberRouter } from "./user.route";
import { ManagerClubMemberRouter } from "./manager.route";
import { ClubMemberService } from "./clubMember.service";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";

export const clubMemberModule = new ContainerModule((bind) => {
  bind<ClubMemberRepository>(CLUB_MEMBER_TYPES.ClubMemberRepository).to(ClubMemberRepository);
  bind<ClubMemberService>(CLUB_MEMBER_TYPES.ClubMemberService).to(ClubMemberService);
  bind<ClubMemberController>(CLUB_MEMBER_TYPES.ClubMemberController).to(ClubMemberController);
  bind<ClubMemberRouter>(CLUB_MEMBER_TYPES.ClubMemberRouter).to(ClubMemberRouter);
  bind<UserClubMemberRouter>(CLUB_MEMBER_TYPES.UserClubMemberRouter).to(UserClubMemberRouter);
  bind<ManagerClubMemberRouter>(CLUB_MEMBER_TYPES.ManagerClubMemberRouter).to(ManagerClubMemberRouter);
});
