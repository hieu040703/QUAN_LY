import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { LeaseContract } from "./LeaseContract";
import { InvoiceStatus } from "./RentalEnums";
import { InvoiceItem } from "./InvoiceItem";
import { Payment } from "./Payment";

// Hóa đơn phải thu theo từng hợp đồng và kỳ thanh toán.
@Index("UQ_invoices_contract_period", ["contractId", "period"], { unique: true })
@Index("IDX_invoices_status_due", ["status", "dueDate"])
@Entity("invoices")
export class Invoice extends BaseEntity {
  // Mã hóa đơn nội bộ.
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Hợp đồng phát sinh hóa đơn.
  @Column({ type: "uuid" })
  contractId: string;

  // Kỳ tiền phòng và dịch vụ.
  @Column({ type: "date" })
  period: Date;

  // Hạn cuối người thuê phải thanh toán.
  @Column({ type: "date" })
  dueDate: Date;

  // Tổng tiền trước các điều chỉnh.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  subtotal: number;

  // Số tiền cuối cùng phải thu.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  // Trạng thái thanh toán của hóa đơn.
  @Column({ type: "varchar", length: 20, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  // Quan hệ tới hợp đồng.
  @ManyToOne(() => LeaseContract, (contract) => contract.invoices, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "contractId" })
  contract: LeaseContract;

  // Các dòng tiền cấu thành hóa đơn.
  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items: InvoiceItem[];

  // Các lần thanh toán hóa đơn.
  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}
