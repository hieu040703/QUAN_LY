import { Notification } from "@/database/models/Notification";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const NotificationSelectBasic: FindOptionsSelect<Notification> = {
  id: true,
  title: true,
  content: true,
  type: true,
  action: true,
  metadata: true,
  oId: true,
};

export const NotificationSelectFull: FindOptionsSelect<Notification> = {
  ...NotificationSelectBasic,
};

export const NotificationRelations: FindOptionsRelations<Notification> = {};
