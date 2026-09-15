import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Club } from "./Club";
import { Packet } from "./Packet";

export enum UserPacketStatus {
  ACTIVE = "active",
  END = "end",
  INACTIVE = "inactive",
}

@Entity("user_packets")
export class UserPacket extends BaseEntity {
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "uuid" })
  packetId: string;

  @Column({ type: "timestamptz", default: () => "now()" })
  startTime: Date;

  @Column({ type: "timestamptz" })
  endTime: Date;

  @Column({ type: "int" })
  quota: number;

  @Column({ type: "int" })
  remainingQuantity: number;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column(BaseNumericColumnOptions)
  bookingAmount: number;

  @Column({ type: "varchar", default: UserPacketStatus.ACTIVE })
  status: UserPacketStatus;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Club)
  @JoinColumn({ name: "clubId" })
  club: Club;

  @ManyToOne(() => Packet)
  @JoinColumn({ name: "packetId" })
  packet: Packet;
}
