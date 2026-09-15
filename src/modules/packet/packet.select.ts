import { Packet } from "@/database/models/Packet";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const PacketSelectBasic: FindOptionsSelect<Packet> = {
  ...BaseSelect,
  code: true,
  name: true,
  quota: true,
  dayLimit: true,
  amount: true,
  bookingAmount: true,
  isActive: true,
};

export const PacketSelectFull: FindOptionsSelect<Packet> = {
  ...PacketSelectBasic,
};

export const PacketRelations: FindOptionsRelations<Packet> = {};
