import { User } from "@/database/models/User";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const AuthSelectBasic: FindOptionsSelect<User> = {
  ...BaseSelect,
  code: true,
  email: true,
  phone: true,
  isActive: true,
  roleId: true,
  username: true,
  name: true,
  dob: true,
  gender: true,
  address: true,
};

export const AuthSelectFull: FindOptionsSelect<User> = {
  ...AuthSelectBasic,
  password: true,
  role: true,
};

export const AuthRelations: FindOptionsRelations<User> = {
  role: true,
};
