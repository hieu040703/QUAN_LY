import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { UserNotification } from "./UserNotification";
import { Role } from "./Role";
import { Address } from "@/shared/base/BaseValidator";
import { GenderEnum } from "@/shared/constants/enum";

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

  // ============================== RELATIONSHIPS ==============================
  @ManyToOne(() => Role, { onDelete: "SET NULL" })
  @JoinColumn({ name: "roleId" })
  role: Role | null;

  @OneToMany(() => UserNotification, (notification) => notification.user)
  userNotifications?: UserNotification[];

}
