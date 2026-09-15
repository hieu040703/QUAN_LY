import { BaseRepository } from "@/shared/base/BaseRepository";
import { Notification } from "@/database/models/Notification";
import { FindOptionsSelect } from "typeorm";
import {
  NotificationSelectFull,
  NotificationRelations,
} from "./notification.select";

export class NotificationRepository extends BaseRepository<Notification> {
  protected entityClass = Notification;
  protected selectedFields = NotificationSelectFull;
  protected relations = NotificationRelations;

  constructor() {
    super();
  }

  setOptions(
    selectedFields?: FindOptionsSelect<Notification> | undefined,
  ): void {
    this.selectedFields = selectedFields || NotificationSelectFull;
    this.relations = NotificationRelations;
  }
}
