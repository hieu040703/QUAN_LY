import { ClubRole } from "@/database/models/ClubRole";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ClubRoleSelectBasic: FindOptionsSelect<ClubRole> = {
  ...BaseSelect,
  name: true,
  permissions: true,
  clubId: true,
};

export const ClubRoleSelectFull: FindOptionsSelect<ClubRole> = {
  ...ClubRoleSelectBasic,
};

export const ClubRoleRelations: FindOptionsRelations<ClubRole> = {};
