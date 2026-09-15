import { BaseEntity } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity("seen_messages")
export class SeenMessage extends BaseEntity {
  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "timestamptz" })
  seenAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
