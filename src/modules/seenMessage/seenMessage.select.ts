import { SeenMessage } from "@/database/models/SeenMessage";
import { BaseSelect, RelationSelectConfig } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const SeenMessageSelectBasic: FindOptionsSelect<SeenMessage> = {
  ...BaseSelect,
  refId: true,
  userId: true,
  seenAt: true,
};

export const SeenMessageSelectFull: FindOptionsSelect<SeenMessage> = {
  ...SeenMessageSelectBasic,
};

export const SeenMessageRelations: FindOptionsRelations<SeenMessage> = {
  user: true,
};

export const SeenMessageRelationSelects: RelationSelectConfig<SeenMessage> = {
  user: ["id", "code", "name", "username", "type"],
};
