import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { ClubMember } from "./ClubMember";
import { PermissionClubStructure } from "@/shared/middleware/clubPermission.middleware";
import { Club } from "./Club";

@Entity("club_roles")
export class ClubRole extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "jsonb", default: {} })
  permissions: PermissionClubStructure;

  // ============================== RELATIONSHIPS ==============================
  @OneToMany(() => ClubMember, (member) => member.clubRole)
  member: ClubMember[];

  @ManyToOne(() => Club, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clubId" })
  club: Club;
}
