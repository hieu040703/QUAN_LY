import { UserPacket } from "@/database/models/UserPacket";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";
import { UserSelectBasic } from "../user/user.select";

export const UserPacketSelectBasic: FindOptionsSelect<UserPacket> = {
  ...BaseSelect,
  userId: true,
  clubId: true,
  packetId: true,
  startTime: true,
  endTime: true,
  status: true,
  quota: true,
  remainingQuantity: true,
  amount: true,
  bookingAmount: true,
};

export const UserPacketSelectFull: FindOptionsSelect<UserPacket> = {
  ...UserPacketSelectBasic,
  user: UserSelectBasic,
};

export const UserPacketRelations: FindOptionsRelations<UserPacket> = {
  user: true,
  club: true,
  packet: true,
};
