import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const UserSelectBasic: FindOptionsSelect<User> = {
  ...BaseSelect,
  code: true,
  roleId: true,
  username: true,
  isActive: true,
  address: true,
  type: true,
  gender: true,
  name: true,
  email: true,
  phone: true,
  dob: true,
  job: true,
  about: true,
  target: true,
  contactChannel: true,
  arrivalTimes: true,
  healthStatus: true,
  referralCode: true,
  isLeader: true,
  zalo: true,
  messenger: true,
};

export const UserSelectFull: FindOptionsSelect<User> = {
  ...UserSelectBasic,
  password: true,
  role: true,
};

export const UserRelations: FindOptionsRelations<User> = {
  role: true,
};
