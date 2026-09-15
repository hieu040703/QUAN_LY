import { SeenMessage } from "@/database/models/SeenMessage";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { SeenMessageQueryDto } from "./seenMessage.validator";
import {
  SeenMessageRelationSelects,
  SeenMessageRelations,
  SeenMessageSelectFull,
} from "./seenMessage.select";

export class SeenMessageRepository extends BaseRepository<SeenMessage> {
  protected entityClass = SeenMessage;
  protected selectedFields = SeenMessageSelectFull;
  protected relations = SeenMessageRelations;
  protected relationSelects = SeenMessageRelationSelects;
  protected relationSelectsForList = SeenMessageRelationSelects;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<SeenMessage>,
    options: IFindPaginationOptions<SeenMessage>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const { refId } = (options.moreQuery as SeenMessageQueryDto) || {};
    if (refId) {
      qb.andWhere("entity.refId = :seenMessageRefId", { seenMessageRefId: refId });
    }
  }
}
