import { Entity, Column, OneToMany, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { UserNotification } from "./UserNotification";
import { Role } from "./Role";
import { Address } from "@/shared/base/BaseValidator";
import { UserPacket } from "./UserPacket";
import { GenderEnum } from "@/shared/constants/enum";
import { ClubMember } from "./ClubMember";

export enum UserType {
  EMPLOYEE = "employee",
  CUSTOMER = "customer",
}

// ============================== USER ENTITIES ==============================
@Entity("users")
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 50 })
  code: string;

  @Column({ type: "varchar", length: 256, nullable: true, default: null })
  name: string;

  @Column({ type: "enum", enum: GenderEnum, default: GenderEnum.OTHER })
  gender: GenderEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  roleId: string | null;

  @Column({ type: "timestamptz", nullable: true })
  dob: Date | null;

  @Column({ type: "varchar", nullable: true })
  zalo: string | null;

  @Column({ type: "varchar", nullable: true })
  messenger: string | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean; // trạng thái

  @Column({ type: "jsonb", nullable: true })
  address: Address | null;

  @Column({ type: "varchar", length: 100 })
  username: string;
  @Column({ type: "varchar", length: 255 })
  password: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", default: UserType.CUSTOMER })
  type: UserType;

  @Column({ type: "varchar", nullable: true, default: null })
  job: string | null; // Nghề nghiệp

  @Column({ type: "varchar", nullable: true, default: null })
  about: string | null; // Biết đến FIT từ đâu

  @Column({ type: "varchar", nullable: true, default: null })
  target: string | null; // Mục tiêu sức khỏe

  @Column({ type: "varchar", nullable: true, default: null })
  contactChannel: string | null; // Kênh liên lạc ưu tiên

  @Column({ type: "varchar", nullable: true, default: null })
  arrivalTimes: string | null; // Thời gian thường đến

  @Column({ type: "varchar", nullable: true, default: null })
  healthStatus: string | null; // Tình trạng sức khỏe

  @Column({ type: "varchar", nullable: true, default: null })
  referralCode: string | null; // Mã giới thiệu

  @Column({ type: "boolean", default: false })
  isLeader: boolean; // Có quyền tạo CLB hay không

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Role, { onDelete: "SET NULL" })
  @JoinColumn({ name: "roleId" })
  role: Role | null;

  @OneToMany(() => UserNotification, (notification) => notification.user)
  userNotifications?: UserNotification[];

  @OneToMany(() => UserPacket, (u) => u.user)
  userPacket: UserPacket[];

  @OneToMany(() => ClubMember, (cm) => cm.user)
  clubMembers: ClubMember[];
}
