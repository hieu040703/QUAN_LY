import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Property } from "./Property";
import { FeeType } from "./FeeType";

// Đơn giá một loại phí tại một khu trọ.
@Index("UQ_property_fees_property_type", ["propertyId", "feeTypeId"], { unique: true })
@Entity("property_fees")
export class PropertyFee extends BaseEntity {
  // Khu trọ áp dụng phí.
  @Column({ type: "uuid" })
  propertyId: string;

  // Loại phí được áp dụng.
  @Column({ type: "uuid" })
  feeTypeId: string;

  // Đơn giá của loại phí.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  unitPrice: number;

  // Cho biết phí còn được áp dụng hay đã tắt.
  @Column({ type: "boolean", default: true })
  isActive: boolean;

  // Quan hệ tới khu trọ.
  @ManyToOne(() => Property, { onDelete: "CASCADE" })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  // Quan hệ tới loại phí.
  @ManyToOne(() => FeeType, (feeType) => feeType.propertyFees, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "feeTypeId" })
  feeType: FeeType;
}
