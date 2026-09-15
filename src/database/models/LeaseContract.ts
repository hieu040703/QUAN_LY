import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Room } from "./Room";
import { ContractStatus } from "./RentalEnums";
import { ContractTenant } from "./ContractTenant";
import { Invoice } from "./Invoice";

// Hợp đồng thuê một phòng trong một khoảng thời gian.
@Index("IDX_lease_contracts_room_status", ["roomId", "status"])
@Index("UQ_lease_contracts_active_room", ["roomId"], { unique: true, where: '"status" = \'active\'' })
@Entity("lease_contracts")
export class LeaseContract extends BaseEntity {
  // Mã hợp đồng nội bộ.
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Phòng được thuê.
  @Column({ type: "uuid" })
  roomId: string;

  // Chủ trọ hoặc user quản lý hợp đồng.
  @Column({ type: "uuid" })
  landlordId: string;

  // Ngày bắt đầu hiệu lực.
  @Column({ type: "date" })
  startDate: Date;

  // Ngày kết thúc hợp đồng.
  @Column({ type: "date" })
  endDate: Date;

  // Tiền thuê theo tháng.
  @Column({ type: "decimal", precision: 15, scale: 2 })
  rentAmount: number;

  // Tiền cọc đã thỏa thuận.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  depositAmount: number;

  // Trạng thái hiệu lực của hợp đồng.
  @Column({ type: "varchar", length: 20, default: ContractStatus.DRAFT })
  status: ContractStatus;

  // Điều khoản bổ sung của hợp đồng.
  @Column({ type: "text", nullable: true, default: null })
  terms: string | null;

  // Quan hệ tới phòng thuê.
  @ManyToOne(() => Room, (room) => room.leaseContracts, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "roomId" })
  room: Room;

  // Quan hệ tới chủ trọ/quản lý.
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "landlordId" })
  landlord: User;

  // Những người thuê thuộc hợp đồng.
  @OneToMany(() => ContractTenant, (tenant) => tenant.contract)
  tenants: ContractTenant[];

  // Các hóa đơn phát sinh từ hợp đồng.
  @OneToMany(() => Invoice, (invoice) => invoice.contract)
  invoices: Invoice[];
}
