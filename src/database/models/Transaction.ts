import { Entity, Column } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";

export enum TransactionTypeEnum {
  IN = "in",
  OUT = "out",
}

export enum RefType {
  PACKAGE = "package",
  CHECK_IN = "check_in",
}

@Entity("transactions")
export class Transaction extends BaseEntity {
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  clubId: string; //

  @Column({ type: "uuid" })
  packetId: string;

  @Column({ type: "uuid", nullable: true })
  usedClubId: string | null;

  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "int" })
  quantity: number;

  @Column(BaseNumericColumnOptions)
  amount: number;

  @Column({ type: "enum", enum: TransactionTypeEnum })
  type: TransactionTypeEnum;

  @Column({ type: "varchar" })
  refType: RefType;

  @Column({ type: "timestamptz" })
  timeAt: Date;
}
