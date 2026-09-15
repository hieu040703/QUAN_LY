import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Invoice } from "./Invoice";

// Một dòng chi tiết trong hóa đơn, ví dụ tiền phòng hoặc tiền điện.
@Entity("invoice_items")
export class InvoiceItem extends BaseEntity {
  // Hóa đơn chứa dòng chi tiết này.
  @Column({ type: "uuid" })
  invoiceId: string;

  // Tên khoản thu được lưu snapshot trên hóa đơn.
  @Column({ type: "varchar", length: 100 })
  name: string;

  // Số lượng sử dụng, ví dụ số kWh điện.
  @Column({ type: "decimal", precision: 12, scale: 3, default: 1 })
  quantity: number;

  // Đơn giá của khoản thu.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  unitPrice: number;

  // Thành tiền của dòng: quantity nhân unitPrice.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  amount: number;

  // Quan hệ tới hóa đơn.
  @ManyToOne(() => Invoice, (invoice) => invoice.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "invoiceId" })
  invoice: Invoice;
}
