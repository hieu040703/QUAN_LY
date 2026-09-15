import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity, UserSnapshot } from "@/shared/base/BaseEntity";
import { User } from "./User";

export interface OperationChangeItem {
  path: string;
  before: unknown;
  after: unknown;
}

export interface OperationErrorItem {
  name?: string;
  message: string;
  statusCode?: number;
  code?: string | number;
  errors?: unknown;
  stack?: string;
}

@Entity("operation_logs")
@Index("IDX_operation_logs_actorId", ["actorId"])
@Index("IDX_operation_logs_targetEntity", ["targetEntity"])
@Index("IDX_operation_logs_targetId", ["targetId"])
@Index("IDX_operation_logs_createdAt", ["createdAt"])
export class OperationLog extends BaseEntity {
  // Hành động thực hiện
  @Column({ type: "varchar", length: 50 })
  action: string;

  @Column({ type: "varchar", length: 100 })
  targetEntity: string;

  @Column({ type: "uuid", nullable: true, default: null })
  targetId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  requestBody: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  targetSnapshot: Record<string, unknown> | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  changes: OperationChangeItem[] | null;

  @Column({ type: "uuid", nullable: true, default: null })
  actorId: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  actorSnapshot: UserSnapshot | null;

  @Column({ type: "varchar", length: 100, nullable: true, default: null })
  requestId: string | null;

  @Column({ type: "varchar", length: 50, nullable: true, default: null })
  method: string | null;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  endpoint: string | null;

  @Column({ type: "varchar", length: 100, nullable: true, default: null })
  ipAddress: string | null;

  @Column({ type: "text", nullable: true, default: null })
  userAgent: string | null;

  @Column({ type: "boolean", default: false })
  success: boolean;

  @Column({ type: "jsonb", nullable: true, default: null })
  error: OperationErrorItem | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  metadata: Record<string, unknown> | null;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "actorId" })
  actor: User | null;
}
