import { Entity, Column, ManyToMany, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Club } from "./Club";
import { UserPacket } from "./UserPacket";

export enum CheckInDirection {
  IN = "in",
  OUT = "out",
}

@Entity("check_ins")
export class CheckIn extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  code: string | null;

  @Column({ type: "uuid", nullable: true })
  bookingId: string | null;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "int" })
  quantity: number;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "boolean", default: false })
  paid: boolean;

  @Column({ type: "uuid", nullable: true })
  userPacketId: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Club, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clubId" })
  club: Club;

  @ManyToOne(() => UserPacket, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userPacketId" })
  userPacket: UserPacket | null;
}
