import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Club } from "./Club";
import { User } from "./User";
import { ClubRole } from "./ClubRole";

export enum MemberStatus {
  PENDING = "pending", // chờ duyệt
  ACTIVE = "active", // trong nhóm
  BLOCKED = "blocked", // chặn
  OUT = "out", // đã ròi khỏi nhóm
}

export enum RoleClub {
  LEADER = "leader",
  MANAGER = "manager",
  MEMBER = "member",
}

@Entity("club_members")
export class ClubMember extends BaseEntity {
  @Column({ type: "uuid" })
  clubId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 20, default: MemberStatus.PENDING })
  status: MemberStatus;

  @Column({ type: "varchar", length: 20, default: RoleClub.MEMBER })
  role: RoleClub;

  @Column({ type: "uuid", nullable: true })
  clubRoleId: string | null;

  @Column({ type: "text", nullable: true })
  memberNote: string | null;

  @ManyToOne(() => Club, { onDelete: "CASCADE" })
  @JoinColumn({ name: "clubId" })
  club: Club;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => ClubRole, { onDelete: "SET NULL" })
  @JoinColumn({ name: "clubRoleId" })
  clubRole: ClubRole | null;
}
