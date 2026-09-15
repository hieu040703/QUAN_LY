import { CheckIn } from "@/database/models/CheckIn";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const CheckInSelectBasic: FindOptionsSelect<CheckIn> = {
  ...BaseSelect,
  code: true,
  userId: true,
  clubId: true,
  quantity: true,
  amount: true,
  userPacketId: true,
  bookingId: true,
  paid: true,
};

export const CheckInSelectFull: FindOptionsSelect<CheckIn> = {
  ...CheckInSelectBasic,
};

export const CheckInRelations: FindOptionsRelations<CheckIn> = {
  user: true,
  club: true,
  userPacket: {
    packet: true,
  },
};
