import { Column, Entity, Index, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { RoomAmenity } from "./RoomAmenity";

// Danh mục tiện ích có thể gắn cho nhiều phòng.
@Index("UQ_amenities_name", ["name"], { unique: true })
@Entity("amenities")
export class Amenity extends BaseEntity {
  // Tên tiện ích, ví dụ máy lạnh hoặc máy giặt.
  @Column({ type: "varchar", length: 100 })
  name: string;

  // Tên icon để giao diện hiển thị.
  @Column({ type: "varchar", length: 100, nullable: true, default: null })
  icon: string | null;

  // Các phòng đang sử dụng tiện ích này.
  @OneToMany(() => RoomAmenity, (roomAmenity) => roomAmenity.amenity)
  roomAmenities: RoomAmenity[];
}
