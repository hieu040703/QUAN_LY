import { Club } from "@/database/models/Club";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ClubSelectBasic: FindOptionsSelect<Club> = {
  ...BaseSelect,
  code: true,
  name: true,
  hotline: true,
  isActive: true,
  address: true,
  latitude: true,
  longitude: true,
  leaderId: true,
  openingDay: true,
  capacity: true,
  leaderSnapshot: true,
};

export const ClubSelectFull: FindOptionsSelect<Club> = {
  ...ClubSelectBasic,
};

export const ClubRelations: FindOptionsRelations<Club> = {
  leader: true,
  clubActivities: true,
};

export const ClubRelationsForList: FindOptionsRelations<Club> = {
  leader: true,
  clubActivities: true,
};
