import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { UserNotification } from "./UserNotification";

export enum NotificationTypeEnum {
  BOOKING = "booking",
  CLUB_MEMBER = "club_member",
  CHECK_IN = "check_in",
  CLUB = "club",
  COLLECTOR = "collector",
  USER_PACKET = "user_packet",
  SYSTEM = "system",
  LISTING = "listing",
  INQUIRY = "inquiry",
  CONTRACT = "contract",
  INVOICE = "invoice",
  PAYMENT = "payment",
  MAINTENANCE = "maintenance",
}

export enum ActionTypeEnum {
  BOOKING_PENDING = "booking_pending",
  BOOKING_CONFIRMED = "booking_confirmed",
  BOOKING_CANCEL = "booking_cancel",
  SUCCESS = "success",
  COLLECTED = "collected",
  OPENING_DAY = "opening_day",
  MEMBER_PENDING = "member_pending",
  MEMBER_ACTIVE = "member_active",
  MEMBER_OUT = "member_out",
  MEMBER_BLOCK = "member_block",
  NOTIFICATION = "notification",
  FAILED = "failed",
  QUOTA_EXCEEDED = "quot_exceeded",
  PACKET_EXPIRED = "packet_expired",
  QUOTA_LOW = "quote_low",
  NO_BOOKING = "no_booking",
  OUT_OF_SLOT = "out_of_booking",
  CLOSED = "closed",
  REOPENED = "reopened",
  LEADER_CHANGED = "leader_changed",
  INFO_UPDATED = "info_update",
  SCHEDULE_UPDATED = "schedule_updated",
  CAPACITY_FULL = "capacity_full",
  PACKET_EXPIRING = "package_expired",
  PACKET_LOW_QUOTA = "packet_low_quota",
  LEADER_ASSIGNED = "leader_assigned",
  CREATED = "created",
  UPDATED = "updated",
  APPROVED = "approved",
  REJECTED = "rejected",
  DUE = "due",
  PAID = "paid",
  CANCELLED = "cancelled",
}

// Notification entity for system, club, friend, and tournament notifications
@Entity("notifications")
export class Notification extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "uuid", nullable: true, default: null })
  oId: string | null;

  @Column({ type: "varchar", enum: NotificationTypeEnum })
  type!: NotificationTypeEnum;

  @Column({
    type: "varchar",
    enum: ActionTypeEnum,
    nullable: true,
    default: null,
  })
  action!: ActionTypeEnum | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: any;

  @OneToMany(() => UserNotification, (notification) => notification.notification)
  userNotifications?: UserNotification[];
}
