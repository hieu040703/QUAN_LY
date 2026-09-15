import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Room } from "./Room";
import { UtilityType } from "./RentalEnums";

// Chỉ số điện hoặc nước của một phòng theo từng kỳ.
@Index("UQ_utility_readings_room_type_period", ["roomId", "type", "period"], { unique: true })
@Entity("utility_readings")
export class UtilityReading extends BaseEntity {
  // Phòng được ghi chỉ số.
  @Column({ type: "uuid" })
  roomId: string;

  // Loại tiện ích đang ghi.
  @Column({ type: "varchar", length: 20 })
  type: UtilityType;

  // Kỳ ghi chỉ số, thường là ngày đầu hoặc cuối tháng.
  @Column({ type: "date" })
  period: Date;

  // Chỉ số cuối kỳ trước.
  @Column({ type: "decimal", precision: 12, scale: 3 })
  previousReading: number;

  // Chỉ số cuối kỳ hiện tại.
  @Column({ type: "decimal", precision: 12, scale: 3 })
  currentReading: number;

  // Đơn giá áp dụng cho kỳ này.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  unitPrice: number;

  // Quan hệ tới phòng.
  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room: Room;
}
