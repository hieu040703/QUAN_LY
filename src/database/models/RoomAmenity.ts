import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { Room } from "./Room";
import { Amenity } from "./Amenity";

// Bảng trung gian thể hiện phòng có những tiện ích nào.
@Index("UQ_room_amenities_room_amenity", ["roomId", "amenityId"], { unique: true })
@Entity("room_amenities")
export class RoomAmenity extends BaseEntity {
  // Phòng được gắn tiện ích.
  @Column({ type: "uuid" })
  roomId: string;

  // Tiện ích được gắn cho phòng.
  @Column({ type: "uuid" })
  amenityId: string;

  // Quan hệ tới phòng.
  @ManyToOne(() => Room, (room) => room.roomAmenities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "roomId" })
  room: Room;

  // Quan hệ tới danh mục tiện ích.
  @ManyToOne(() => Amenity, (amenity) => amenity.roomAmenities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "amenityId" })
  amenity: Amenity;
}
