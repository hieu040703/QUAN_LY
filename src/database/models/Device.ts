import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";

// ============================== DEVICE (FCM) ENTITIES ==============================
@Entity("devices")
@Index(["userId", "fcmToken"], { unique: true })
export class Device extends BaseEntity {
  // Tài khoản sở hữu thiết bị
  @Column({ type: "uuid" })
  userId: string;

  // FCM token dùng để gửi push notification
  @Column({ type: "varchar", length: 512 })
  fcmToken: string;

  // Nền tảng: android / ios / web
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  platform: string | null;

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user?: User;
}
