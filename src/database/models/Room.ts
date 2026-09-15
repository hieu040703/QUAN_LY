import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Property } from "./Property";
import { RoomStatus } from "./RentalEnums";
import { RoomAmenity } from "./RoomAmenity";
import { LeaseContract } from "./LeaseContract";

// Phòng cụ thể thuộc một khu trọ.
@Index("UQ_rooms_property_code", ["propertyId", "code"], { unique: true })
@Index("IDX_rooms_status", ["status"])
@Entity("rooms")
export class Room extends BaseEntity {
  // Khu trọ chứa phòng này.
  @Column({ type: "uuid" })
  propertyId: string;

  // Mã phòng, ví dụ P101.
  @Column({ type: "varchar", length: 50 })
  code: string;

  // Tên hiển thị tùy chọn của phòng.
  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  name: string | null;

  // Số tầng của phòng.
  @Column({ type: "int", default: 1 })
  floor: number;

  // Diện tích phòng tính bằng mét vuông.
  @Column({ type: "decimal", precision: 10, scale: 2 })
  areaM2: number;

  // Số người tối đa được ở.
  @Column({ type: "int", default: 1 })
  maxOccupants: number;

  // Giá thuê cơ bản mỗi kỳ.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  rentPrice: number;

  // Tiền cọc dự kiến của phòng.
  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  depositAmount: number;

  // Trạng thái hiện tại của phòng.
  @Column({ type: "varchar", length: 20, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  // Phòng đã có sẵn nội thất hay chưa.
  @Column({ type: "boolean", default: false })
  furnished: boolean;

  // Quan hệ tới khu trọ.
  @ManyToOne(() => Property, (property) => property.rooms, { onDelete: "CASCADE" })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  // Các tiện ích của phòng.
  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.room)
  roomAmenities: RoomAmenity[];

  // Các hợp đồng từng gắn với phòng.
  @OneToMany(() => LeaseContract, (contract) => contract.room)
  leaseContracts: LeaseContract[];
}
