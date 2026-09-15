import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Club } from "./Club";

@Entity("club_activities")
export class ClubActivity extends BaseEntity {
  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "int" })
  day: number;

  @Column({ type: "time" })
  start: string;

  @Column({ type: "time" })
  end: string;

  @ManyToOne(() => Club, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clubId" })
  club: Club;
}
