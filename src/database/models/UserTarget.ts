import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

export enum UserTargetStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  FAILURE = "failure",
}

export enum UserTargetType {
  UP = "up",
  DOWN = "down",
}

export enum UserTargetProgressType {
  LINEAR = "linear",
  EASE_OUT = "ease_out", // dốc giảm dần
  EASE_IN = "ease_in", // dốc tăng dần
}

@Entity("user_targets")
export class UserTarget extends BaseEntity {
  @Column({ type: "uuid" })
  userId: string;
  @Column(BaseNumericColumnOptions)
  startValue: number; // cân nặng lúc bắt đầu mục tiêu - tự động lấy từ health_indicators mới nhất, KHÔNG cho client nhập
  @Column(BaseNumericColumnOptions)
  target: number; // mục tiêu

  @Column(BaseNumericColumnOptions)
  current: number; // hiện tại

  @Column({ type: "timestamptz" })
  startTime: Date;

  @Column({ type: "timestamptz" })
  deadline: Date;

  @Column({ type: "varchar" })
  type: UserTargetType;

  @Column({ type: "varchar", default: UserTargetProgressType.LINEAR })
  progressType: UserTargetProgressType;
  @Column({ type: "varchar", default: UserTargetStatus.PENDING })
  status: UserTargetStatus;
}
