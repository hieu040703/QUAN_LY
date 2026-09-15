import { Chat } from "@/database/models/Chat";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const ChatSelectBasic: FindOptionsSelect<Chat> = {
  ...BaseSelect,
  refId: true,
  type: true,
  userId: true,
  userSnapshot: true,
  content: true,
};

export const ChatSelectFull: FindOptionsSelect<Chat> = {
  ...ChatSelectBasic,
};

export const ChatRelations: FindOptionsRelations<Chat> = {
  user: true,
};

export const ChatRelationSelects: RelationSelectConfig<Chat> = {
  user: ["id", "code", "name", "username", "type"],
};
