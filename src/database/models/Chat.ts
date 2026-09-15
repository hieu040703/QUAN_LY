import { BaseEntity, UserSnapshot } from "@/shared/base/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";

export enum ConversationTypeEnum {
  BOOKING = "booking",
  PAYMENT = "payment",
}

@Entity("chats")
export class Chat extends BaseEntity {
  @Column({ type: "uuid" })
  refId: string;

  @Column({ type: "varchar" })
  type: ConversationTypeEnum;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @Column({ type: "jsonb", nullable: true })
  userSnapshot: UserSnapshot | null;

  @Column({ type: "text" })
  content: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user: User;
}
