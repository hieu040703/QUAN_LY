import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity, UserSnapshot } from "@/shared/base/BaseEntity";
import { Address } from "@/shared/base/BaseValidator";
import { User } from "./User";
import { ClubActivity } from "./ClubActivity";

export interface ClubSnapshot {
  code: string;
  name: string;
  address: Address;
}

@Entity("clubs")
export class Club extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  code: string | null;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "varchar", length: 40, nullable: true })
  hotline?: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "jsonb" })
  address!: Address;

  @Column({ type: "varchar" })
  latitude: string;

  @Column({ type: "varchar" })
  longitude: string;

  @Column({ type: "uuid", nullable: true })
  leaderId: string | null;

  @Column({ type: "timestamptz", default: () => "now()" })
  openingDay: Date;

  @Column({ type: "int" })
  capacity: number;

  @Column({ type: "jsonb", nullable: true })
  leaderSnapshot: UserSnapshot;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "leaderId" })
  leader: User | null;

  @OneToMany(() => ClubActivity, (c) => c.club, { cascade: true })
  clubActivities: ClubActivity[];
}
