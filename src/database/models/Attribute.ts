import { Entity, Column } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";

export enum AttributeTypeEnum {
  PRODUCT_CATEGORY = "product_category",
  PRODUCT_UNIT = "product_unit",
  DEGREE = "degree",
  SPECIALTY = "specialty",
  INCOME_CATEGORY = "income_category",
  EXPENSE_CATEGORY = "expense_category",
}

export interface AttributeSnapshot {
  id: string;
  code: string | null;
  name: string;
  type: AttributeTypeEnum;
}

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("attributes")
export class Attribute extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  code: string | null;
  @Column({ type: "text" })
  name: string;

  @Column({ type: "varchar", enum: AttributeTypeEnum })
  type: AttributeTypeEnum;
}
