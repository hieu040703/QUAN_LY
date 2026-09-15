import { Entity, ManyToOne, Column, JoinColumn } from "typeorm";
import { User } from "./User";
import { BaseEntity } from "@/shared/base/BaseEntity";

// Token entity for tracking user tokens
@Entity("tokens")
export class Token extends BaseEntity {
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "varchar" })
  refreshToken!: string;

  @Column({ type: "time with time zone", default: () => "CURRENT_TIMESTAMP" })
  expiresAt!: Date;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;
}
