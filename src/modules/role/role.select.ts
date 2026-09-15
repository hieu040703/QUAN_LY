import { Role } from "@/database/models/Role";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const RoleSelectBasic: FindOptionsSelect<Role> = {
  ...BaseSelect,
  name: true,
  permissions: true,
};

export const RoleSelectFull: FindOptionsSelect<Role> = {
  ...RoleSelectBasic,
};

export const RoleRelations: FindOptionsRelations<Role> = {};
