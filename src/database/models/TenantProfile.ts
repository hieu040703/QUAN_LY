import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";

// Thông tin bổ sung dành cho user đóng vai trò người thuê.
@Index("UQ_tenant_profiles_user", ["userId"], { unique: true })
@Entity("tenant_profiles")
export class TenantProfile extends BaseEntity {
  // User sở hữu hồ sơ người thuê.
  @Column({ type: "uuid" })
  userId: string;

  // Loại giấy tờ tùy thân.
  @Column({ type: "varchar", length: 20, nullable: true, default: null })
  identityType: string | null;

  // Số giấy tờ tùy thân.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  identityNumber: string | null;

  // Tên người liên hệ khi có sự cố.
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  emergencyContactName: string | null;

  // Số điện thoại người liên hệ khẩn cấp.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  emergencyContactPhone: string | null;

  // Nghề nghiệp của người thuê.
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  occupation: string | null;

  // Quan hệ tới tài khoản user.
  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
