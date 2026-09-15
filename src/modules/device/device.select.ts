import { Device } from "@/database/models/Device";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const DeviceSelectBasic: FindOptionsSelect<Device> = {
  ...BaseSelect,
  userId: true,
  fcmToken: true,
  platform: true,
};

export const DeviceSelectFull: FindOptionsSelect<Device> = {
  ...DeviceSelectBasic,
};

export const DeviceRelations: FindOptionsRelations<Device> = {
  user: true,
};
