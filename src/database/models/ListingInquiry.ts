import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Listing } from "./Listing";
import { InquiryStatus } from "./RentalEnums";

// Yêu cầu liên hệ do người xem gửi cho chủ tin.
@Index("IDX_listing_inquiries_listing_status", ["listingId", "status"])
@Entity("listing_inquiries")
export class ListingInquiry extends BaseEntity {
  // Tin đăng mà người xem quan tâm.
  @Column({ type: "uuid" })
  listingId: string;

  // User gửi yêu cầu liên hệ.
  @Column({ type: "uuid" })
  userId: string;

  // Số điện thoại người gửi tại thời điểm yêu cầu.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  phone: string | null;

  // Nội dung người xem muốn trao đổi.
  @Column({ type: "text" })
  message: string;

  // Trạng thái xử lý yêu cầu.
  @Column({ type: "varchar", length: 20, default: InquiryStatus.NEW })
  status: InquiryStatus;

  // Tin đăng được hỏi.
  @ManyToOne(() => Listing, (listing) => listing.inquiries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing: Listing;

  // User gửi yêu cầu.
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
