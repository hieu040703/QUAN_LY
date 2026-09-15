import { DeepPartial } from "typeorm";
import { User } from "../models/User";

export const adminSeeders: DeepPartial<User>[] = [
  {
    username: "admin",
    name: "Admin",
    code: "ADMINISTRATOR",
    isDefault: true,
  },
];
