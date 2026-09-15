import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { FileEntity } from "./File";
import { Listing } from "./Listing";

// Liên kết hình ảnh/file với tin đăng.
@Index("UQ_listing_media_listing_file", ["listingId", "fileId"], { unique: true })
@Entity("listing_media")
export class ListingMedia extends BaseEntity {
  // Tin đăng chứa file.
  @Column({ type: "uuid" })
  listingId: string;

  // File đã được upload trong bảng files.
  @Column({ type: "uuid" })
  fileId: string;

  // Thứ tự hiển thị hình ảnh.
  @Column({ type: "int", default: 0 })
  sortIndex: number;

  // Đánh dấu ảnh đại diện của tin.
  @Column({ type: "boolean", default: false })
  isCover: boolean;

  // Quan hệ tới tin đăng.
  @ManyToOne(() => Listing, (listing) => listing.media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing: Listing;

  // Quan hệ tới file vật lý.
  @ManyToOne(() => FileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "fileId" })
  file: FileEntity;
}
