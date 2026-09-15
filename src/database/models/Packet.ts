import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

@Entity("packets")
export class Packet extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  code: string | null;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "int" })
  quota: number; // Nếu quota = 1 => gói ngày

  @Column({ type: "int" })
  dayLimit: number;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column(BaseNumericColumnOptions)
  bookingAmount: number; // Giá áp dụng nếu đặt trước

  @Column({ type: "boolean", default: true })
  isActive: boolean;
}
