import { Column, Entity, Index, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { FeeCalculationType } from "./RentalEnums";
import { PropertyFee } from "./PropertyFee";

// Danh mục các loại phí áp dụng trong khu trọ.
@Index("UQ_fee_types_name", ["name"], { unique: true })
@Entity("fee_types")
export class FeeType extends BaseEntity {
  // Tên phí, ví dụ tiền điện hoặc tiền gửi xe.
  @Column({ type: "varchar", length: 100 })
  name: string;

  // Cách tính phí.
  @Column({ type: "varchar", length: 20, default: FeeCalculationType.FIXED })
  calculationType: FeeCalculationType;

  // Đơn vị tính hiển thị, ví dụ kWh hoặc người.
  @Column({ type: "varchar", length: 20, default: "month" })
  unit: string;

  // Cấu hình phí theo từng khu trọ.
  @OneToMany(() => PropertyFee, (propertyFee) => propertyFee.feeType)
  propertyFees: PropertyFee[];
}
