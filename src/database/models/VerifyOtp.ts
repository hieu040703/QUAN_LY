import { BaseEntity } from "@/shared/base/BaseEntity";
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

export enum VerifyOtpTypeEnum {
  REGISTER = "register",
  FORGOT_PASSWORD = "forgot_password",
  EMAIL_CHANGE = "email_change",
  PHONE_CHANGE = "phone_change",
  PASSWORD_CHANGE = "password_change",
}

@Entity("verify_otps")
export class VerifyOtp extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;
  @Column({ type: "varchar", length: 15, nullable: true, default: null })
  phone: string | null;

  @Column({ type: "enum", enum: VerifyOtpTypeEnum })
  type: VerifyOtpTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  userId: string | null;

  @Column({ type: "varchar", length: 10 })
  otp: string;

  @Column({ type: "boolean", default: false })
  isUsed: boolean;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;
}
