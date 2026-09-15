import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Property } from "./Property";
import { Room } from "./Room";
import { ListingStatus, ListingType } from "./RentalEnums";
import { ListingFavorite } from "./ListingFavorite";
import { ListingInquiry } from "./ListingInquiry";
import { ListingMedia } from "./ListingMedia";
import { ViewingAppointment } from "./ViewingAppointment";

// Tin đăng cho thuê hoặc bán một khu trọ/phòng.
@Index("IDX_listings_search", ["status", "type", "province", "district"])
@Index("IDX_listings_price", ["price"])
@Check(
  "CHK_listings_one_target",
  '(("propertyId" IS NOT NULL AND "roomId" IS NULL) OR ("propertyId" IS NULL AND "roomId" IS NOT NULL))',
)
@Entity("listings")
export class Listing extends BaseEntity {
  // User tạo và chịu trách nhiệm cho tin đăng.
  @Column({ type: "uuid" })
  ownerId: string;

  // Khu trọ được đăng bán/cho thuê, có thể để trống nếu đăng riêng phòng.
  @Column({ type: "uuid", nullable: true, default: null })
  propertyId: string | null;

  // Phòng được đăng bán/cho thuê, có thể để trống nếu đăng cả khu trọ.
  @Column({ type: "uuid", nullable: true, default: null })
  roomId: string | null;

  // Loại giao dịch: thuê hoặc bán.
  @Column({ type: "varchar", length: 20 })
  type: ListingType;

  // Tiêu đề hiển thị trên danh sách tin.
  @Column({ type: "varchar", length: 255 })
  title: string;

  // Đường dẫn thân thiện dùng khi mở chi tiết tin.
  @Column({ type: "varchar", length: 255, unique: true })
  slug: string;

  // Nội dung mô tả chi tiết tin đăng.
  @Column({ type: "text" })
  description: string;

  // Giá thuê theo tháng hoặc giá bán tùy theo type.
  @Column({ type: "decimal", precision: 15, scale: 2 })
  price: number;

  // Diện tích được hiển thị trên tin đăng.
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true, default: null })
  areaM2: number | null;

  // Địa chỉ snapshot để tin vẫn giữ thông tin khi khu trọ thay đổi.
  @Column({ type: "varchar", length: 255 })
  addressLine: string;

  // Phường/xã của địa chỉ tin đăng.
  @Column({ type: "varchar", length: 100 })
  ward: string;

  // Quận/huyện của địa chỉ tin đăng.
  @Column({ type: "varchar", length: 100 })
  district: string;

  // Tỉnh/thành phố của địa chỉ tin đăng.
  @Column({ type: "varchar", length: 100 })
  province: string;

  // Trạng thái hiển thị và duyệt tin.
  @Column({ type: "varchar", length: 20, default: ListingStatus.DRAFT })
  status: ListingStatus;

  // Thời điểm tin bắt đầu hiển thị công khai.
  @Column({ type: "timestamptz", nullable: true, default: null })
  publishedAt: Date | null;

  // Thời điểm tin tự hết hạn.
  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null;

  // Số điện thoại hiển thị để người xem liên hệ.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  contactPhone: string | null;

  // User sở hữu tin đăng.
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  // Khu trọ liên quan tới tin đăng.
  @ManyToOne(() => Property, { onDelete: "SET NULL" })
  @JoinColumn({ name: "propertyId" })
  property: Property | null;

  // Phòng liên quan tới tin đăng.
  @ManyToOne(() => Room, { onDelete: "SET NULL" })
  @JoinColumn({ name: "roomId" })
  room: Room | null;

  // Danh sách user đã lưu tin.
  @OneToMany(() => ListingFavorite, (favorite) => favorite.listing)
  favorites: ListingFavorite[];

  // Danh sách yêu cầu liên hệ.
  @OneToMany(() => ListingInquiry, (inquiry) => inquiry.listing)
  inquiries: ListingInquiry[];

  // Danh sách hình ảnh của tin.
  @OneToMany(() => ListingMedia, (media) => media.listing)
  media: ListingMedia[];

  // Danh sách lịch hẹn xem tin/phòng.
  @OneToMany(() => ViewingAppointment, (appointment) => appointment.listing)
  appointments: ViewingAppointment[];
}
