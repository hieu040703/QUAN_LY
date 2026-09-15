import { Entity, Column, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Club } from "./Club";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  CANCELED = "canceled",
}

@Entity("bookings")
export class Booking extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  code: string | null;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "timestamptz" })
  start: Date;

  @Column({ type: "timestamptz" })
  end: Date;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "varchar", default: BookingStatus.PENDING })
  status: BookingStatus;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Club, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clubId" })
  club: Club;
}
