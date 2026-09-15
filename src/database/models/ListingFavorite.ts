import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Listing } from "./Listing";

// Tin đăng được user lưu lại để xem sau.
@Index("UQ_listing_favorites_user_listing", ["userId", "listingId"], { unique: true })
@Entity("listing_favorites")
export class ListingFavorite extends BaseEntity {
  // User lưu tin.
  @Column({ type: "uuid" })
  userId: string;

  // Tin được lưu.
  @Column({ type: "uuid" })
  listingId: string;

  // User thực hiện lưu tin.
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  // Tin đăng được lưu.
  @ManyToOne(() => Listing, (listing) => listing.favorites, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing: Listing;
}
