import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Notification } from "./Notification";

// UserNotification entity for system, club, friend, and tournament notifications
@Entity("user_notifications")
export class UserNotification extends BaseEntity {
  @Column({ type: "int" })
  userId: number;

  @Column({ type: "int" })
  notificationId: number;

  @Column({ type: "boolean", default: false })
  isRead: boolean;

  @ManyToOne(() => User, (user) => user.userNotifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Notification, (notification) => notification.userNotifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "notificationId" })
  notification: Notification;
}
