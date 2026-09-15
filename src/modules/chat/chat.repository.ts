import { Chat } from "@/database/models/Chat";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { ChatQueryDto } from "./chat.validator";
import { ChatRelationSelects, ChatRelations, ChatSelectFull } from "./chat.select";

export class ChatRepository extends BaseRepository<Chat> {
  protected entityClass = Chat;
  protected selectedFields = ChatSelectFull;
  protected relations = ChatRelations;
  protected relationSelects = ChatRelationSelects;
  protected relationSelectsForList = ChatRelationSelects;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Chat>,
    options: IFindPaginationOptions<Chat>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const { refId, type } = (options.moreQuery as ChatQueryDto) || {};

    if (refId) {
      qb.andWhere("entity.refId = :chatRefId", { chatRefId: refId });
    }

    if (type) {
      qb.andWhere("entity.type = :chatType", { chatType: type });
    }
  }
}
