import { ClubMember } from "@/database/models/ClubMember";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ClubMemberSelectBasic: FindOptionsSelect<ClubMember> = {
  ...BaseSelect,
  clubId: true,
  userId: true,
  status: true,
  role: true,
  memberNote: true,
  clubRoleId: true,
};

export const ClubMemberSelectFull: FindOptionsSelect<ClubMember> = {
  ...ClubMemberSelectBasic,
};

export const ClubMemberRelations: FindOptionsRelations<ClubMember> = {
  club: true,
  user: true,
  clubRole: true,
};

export const ClubMemberListRelations: FindOptionsRelations<ClubMember> = {
  user: true,
  club: true,
  clubRole: true,
};
