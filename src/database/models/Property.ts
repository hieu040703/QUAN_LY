import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { PropertyStatus } from "./RentalEnums";
import { Room } from "./Room";

// Khu trọ hoặc tòa nhà do một user quản lý.
@Index("UQ_properties_owner_code", ["ownerId", "code"], { unique: true })
@Index("IDX_properties_status", ["status"])
@Entity("properties")
export class Property extends BaseEntity {
  // Mã nội bộ của khu trọ.
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Tên khu trọ hoặc tòa nhà.
  @Column({ type: "varchar", length: 255 })
  name: string;

  // User sở hữu hoặc chịu trách nhiệm quản lý khu trọ.
  @Column({ type: "uuid" })
  ownerId: string;

  // Mô tả chung về khu trọ.
  @Column({ type: "text", nullable: true, default: null })
  description: string | null;

  // Số nhà, tên đường.
  @Column({ type: "varchar", length: 255 })
  addressLine: string;

  // Phường hoặc xã.
  @Column({ type: "varchar", length: 100 })
  ward: string;

  // Quận hoặc huyện.
  @Column({ type: "varchar", length: 100 })
  district: string;

  // Tỉnh hoặc thành phố.
  @Column({ type: "varchar", length: 100 })
  province: string;

  // Trạng thái hoạt động của khu trọ.
  @Column({ type: "varchar", length: 20, default: PropertyStatus.ACTIVE })
  status: PropertyStatus;

  // Số điện thoại liên hệ của khu trọ.
  @Column({ type: "varchar", length: 30, nullable: true, default: null })
  phone: string | null;

  // Quan hệ tới user quản lý khu trọ.
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "ownerId" })
  owner: User;

  // Danh sách phòng thuộc khu trọ.
  @OneToMany(() => Room, (room) => room.property)
  rooms: Room[];
}
