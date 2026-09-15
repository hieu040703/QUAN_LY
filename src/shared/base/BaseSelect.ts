import { FindOptionsSelect } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export const BaseSelect: FindOptionsSelect<BaseEntity> = {
  id: true,
  createdAt: true,
  creatorId: true,
  creator: true,
  updaterId: true,
  updater: true,
  updatedAt: true,
  note: true,
  isDefault: true,
  sortOrder: true,
};

/**
 * Utility: tạo FindOptionsSelect từ mảng field names.
 * Ví dụ: pickSelect(["id", "name", "code"]) => { id: true, name: true, code: true }
 */
export function pickSelect<T>(fields: (keyof T)[]): FindOptionsSelect<T> {
  const select: Record<string, boolean> = {};
  for (const f of fields) {
    (select as any)[f as string] = true;
  }
  return select as FindOptionsSelect<T>;
}

type ElementType<T> = T extends ReadonlyArray<infer U> ? U : T;

/**
 * RelationSelectConfig: khai báo field cần select cho từng relation.
 * Ví dụ: { customer: ["id", "name", "phone"], machine: ["id", "code", "model"] }
 * Nếu không khai báo hoặc để true, sẽ lấy tất cả field (giữ nguyên behavior cũ).
 * Nếu để false, relation đó không join.
 */
export type RelationSelectValue<T> =
  | Boolean
  | Array<keyof ElementType<NonNullable<T>>>
  | RelationSelectConfig<ElementType<NonNullable<T>>>;
export type RelationSelectConfig<T> = {
  [K in keyof T]?: RelationSelectValue<T[K]>;
};
