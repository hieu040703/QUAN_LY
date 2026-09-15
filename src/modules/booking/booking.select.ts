import { Booking } from "@/database/models/Booking";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const BookingSelectBasic: FindOptionsSelect<Booking> = {
  ...BaseSelect,
  code: true,
  userId: true,
  clubId: true,
  start: true,
  end: true,
  quantity: true,
  status: true,
};

export const BookingSelectFull: FindOptionsSelect<Booking> = {
  ...BookingSelectBasic,
  user: true,
  club: true,
};

export const BookingRelations: FindOptionsRelations<Booking> = {
  user: true,
  club: true,
};
