import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { LeaseContract } from "./LeaseContract";

// Bảng người thuê tham gia một hợp đồng, hỗ trợ nhiều người trong một phòng.
@Index("UQ_contract_tenants_contract_user", ["contractId", "userId"], { unique: true })
@Entity("contract_tenants")
export class ContractTenant extends BaseEntity {
  // Hợp đồng có người thuê này.
  @Column({ type: "uuid" })
  contractId: string;

  // User người thuê.
  @Column({ type: "uuid" })
  userId: string;

  // Tên được chụp tại thời điểm ký hợp đồng.
  @Column({ type: "varchar", length: 255 })
  nameSnapshot: string;

  // Số điện thoại được chụp tại thời điểm ký hợp đồng.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  phoneSnapshot: string | null;

  // Số giấy tờ được chụp tại thời điểm ký hợp đồng.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  identityNumberSnapshot: string | null;

  // Quan hệ tới hợp đồng.
  @ManyToOne(() => LeaseContract, (contract) => contract.tenants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contractId" })
  contract: LeaseContract;

  // Quan hệ tới tài khoản người thuê.
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
}
