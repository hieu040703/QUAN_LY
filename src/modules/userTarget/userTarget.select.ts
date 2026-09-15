import { UserTarget } from "@/database/models/UserTarget";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const UserTargetSelectBasic: FindOptionsSelect<UserTarget> = {
  ...BaseSelect,
  userId: true,
  startValue: true,
  target: true,
  current: true,
  deadline: true,
  status: true,
  startTime: true,
  type: true,
  progressType: true,
};

export const UserTargetSelectFull: FindOptionsSelect<UserTarget> = {
  ...UserTargetSelectBasic,
};

export const UserTargetRelations: FindOptionsRelations<UserTarget> = {};
