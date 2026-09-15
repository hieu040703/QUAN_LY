import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Invoice } from "./Invoice";
import { PaymentMethod, PaymentStatus } from "./RentalEnums";

// Một lần thanh toán của người thuê cho một hóa đơn.
@Index("IDX_payments_invoice_status", ["invoiceId", "status"])
@Entity("payments")
export class Payment extends BaseEntity {
  // Hóa đơn được thanh toán.
  @Column({ type: "uuid" })
  invoiceId: string;

  // Số tiền của lần thanh toán.
  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount: number;

  // Phương thức thanh toán.
  @Column({ type: "varchar", length: 20, default: PaymentMethod.CASH })
  method: PaymentMethod;

  // Trạng thái xử lý giao dịch.
  @Column({ type: "varchar", length: 20, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // Thời điểm thanh toán thành công.
  @Column({ type: "timestamptz", nullable: true, default: null })
  paidAt: Date | null;

  // Mã giao dịch từ ngân hàng hoặc cổng thanh toán.
  @Column({ type: "varchar", length: 100, nullable: true, default: null })
  transactionCode: string | null;

  // Quan hệ tới hóa đơn.
  @ManyToOne(() => Invoice, (invoice) => invoice.payments, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;
}
