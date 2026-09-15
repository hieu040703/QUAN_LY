import { ClubActivity } from "@/database/models/ClubActivity";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ClubActivitySelectBasic: FindOptionsSelect<ClubActivity> = {
  ...BaseSelect,
  clubId: true,
  day: true,
  start: true,
  end: true,
};

export const ClubActivitySelectFull: FindOptionsSelect<ClubActivity> = {
  ...ClubActivitySelectBasic,
};

export const ClubActivityRelations: FindOptionsRelations<ClubActivity> = {
  club: true,
};
