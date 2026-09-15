import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { User } from "./User";
export enum TargetAchievementStatus {
  PENDING = "pending", // chưa xác định
  ACHIEVED = "achieved", // hoàn thành
  NOT_ACHIEVED = "not_achieved", // không hoàn thành
}
@Entity("health_indicators")
export class HealthIndicator extends BaseEntity {
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  timeAt: Date;

  @Column(BaseNumericColumnOptions)
  weight: number;

  @Column(BaseNumericColumnOptions)
  height: number;

  @Column(BaseNumericColumnOptions)
  bodyFat: number; // Mỡ cơ thể

  @Column(BaseNumericColumnOptions)
  muscleMass: number; // Lượng cơ

  @Column(BaseNumericColumnOptions)
  boneWeight: number; // Trọng lượng xương

  @Column(BaseNumericColumnOptions)
  waterVolume: number; // Trọng lượng nước

  @Column(BaseNumericColumnOptions)
  visceralFat: string; // Mỡ nội tạng

  @Column(BaseNumericColumnOptions)
  kcal: number; // Chuyển hóa cơ bản

  @Column({ type: "int" })
  bodyType: number; // Phân loại thể hình

  @Column({ type: "int" })
  biologicalAge: number; // Tuổi sinh học
  @Column({ type: "varchar", nullable: true, default: null })
  isTargetAchieved: TargetAchievementStatus | null;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
