import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Listing } from "./Listing";
import { ViewingAppointmentStatus } from "./RentalEnums";

// Lịch hẹn giữa người xem và người đăng tin.
@Index("IDX_viewing_appointments_schedule", ["scheduledAt", "status"])
@Entity("viewing_appointments")
export class ViewingAppointment extends BaseEntity {
  // Tin đăng được hẹn xem.
  @Column({ type: "uuid" })
  listingId: string;

  // User đặt lịch xem.
  @Column({ type: "uuid" })
  userId: string;

  // Thời gian dự kiến xem phòng.
  @Column({ type: "timestamptz" })
  scheduledAt: Date;

  // Trạng thái lịch hẹn.
  @Column({ type: "varchar", length: 20, default: ViewingAppointmentStatus.PENDING })
  status: ViewingAppointmentStatus;

  // Ghi chú riêng cho lịch hẹn.
  @Column({ type: "text", nullable: true, default: null })
  details: string | null;

  // Tin đăng được hẹn xem.
  @ManyToOne(() => Listing, (listing) => listing.appointments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing: Listing;

  // User đặt lịch.
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
