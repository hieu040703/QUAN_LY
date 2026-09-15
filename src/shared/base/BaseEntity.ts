export interface UserSnapshot {
  id: string;
  code: string;
  name: string;
  username: string;
  type: UserType;
}

import { UserType } from "@/database/models/User";
import {
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Column,
  ColumnOptions,
} from "typeorm";

export const BaseNumericColumnOptions: ColumnOptions = {
  type: "numeric",
  precision: 15,
  scale: 2,
  default: 0,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value || "0"),
  },
};

export const BaseNullableNumericColumnOptions: ColumnOptions = {
  ...BaseNumericColumnOptions,
  nullable: true,
  default: null,
  transformer: {
    to: (value: number | null) => value,
    from: (value: string | null) => (value === null ? null : parseFloat(value)),
  },
};

export const BaseSortOrderColumnOptions: ColumnOptions = {
  type: "numeric",
  precision: 10,
  scale: 4,
  default: 10,
  transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value || "0"),
  },
};

/**
 * Base Entity kết hợp từ base-express và NestJS.
 * - Hỗ trợ soft delete
 * - Có creator/updater/deleter tracking với UserSnapshot
 * - Có sortOrder, isDefault, note
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string; // Khóa chính (UUID)

  @Column({ type: "uuid", nullable: true, default: null })
  tempId?: string | null; // ID tạm (dùng cho optimistic UI trước khi lưu DB)

  @Column({ name: "note", type: "text", nullable: true, default: null })
  note?: string | null; // Ghi chú

  @Column({ type: "uuid", nullable: true, default: null })
  creatorId?: string | null; // ID người tạo

  @Column({ type: "jsonb", nullable: true, default: null })
  creator?: UserSnapshot | null; // Snapshot người tạo (id, code, name, username, type)

  @CreateDateColumn({ name: "createdAt", type: "timestamptz" })
  createdAt: Date; // Thời điểm tạo

  @Column({ type: "uuid", nullable: true, default: null })
  updaterId?: string | null; // ID người cập nhật cuối

  @Column({ type: "jsonb", nullable: true, default: null })
  updater?: UserSnapshot | null; // Snapshot người cập nhật

  @UpdateDateColumn({
    name: "updatedAt",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  updatedAt: Date | null; // Thời điểm cập nhật cuối

  @Column({ type: "uuid", nullable: true, default: null })
  deleterId?: string | null; // ID người xóa

  @Column({ type: "jsonb", nullable: true, default: null })
  deleterSnapshot?: UserSnapshot | null; // Snapshot người xóa

  @DeleteDateColumn({ name: "deletedAt", type: "timestamptz", nullable: true })
  deletedAt?: Date | null; // Thời điểm xóa mềm

  @Column({ type: "boolean", default: false })
  isDefault: boolean; // Là bản ghi mặc định?

  @Column(BaseSortOrderColumnOptions)
  sortOrder: number; // Thứ tự sắp xếp

  get isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }
}

/**
 * BaseEntity nhẹ không có tracking fields - dùng cho entity con
 */
export abstract class LightBaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string; // Khóa chính (UUID)

  @CreateDateColumn({ name: "createdAt", type: "timestamptz" })
  createdAt: Date; // Thời điểm tạo

  @UpdateDateColumn({
    name: "updatedAt",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  updatedAt: Date | null; // Thời điểm cập nhật cuối

  @DeleteDateColumn({ name: "deletedAt", type: "timestamptz", nullable: true })
  deletedAt?: Date | null; // Thời điểm xóa mềm
}
