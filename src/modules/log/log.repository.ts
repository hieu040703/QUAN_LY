import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { OperationLog } from "@/database/models/OperationLog";
import { LogRelations, LogSelectFull } from "./log.select";
import { SelectQueryBuilder } from "typeorm";
import { LogQueryDto } from "./log.validator";

export class LogRepository extends BaseRepository<OperationLog> {
  protected entityClass = OperationLog;
  protected selectedFields = LogSelectFull;
  protected relations = LogRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<OperationLog>,
    options: IFindPaginationOptions<OperationLog>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const { actorId, targetEntity, action, targetId } =
      (options.moreQuery as LogQueryDto) || {};

    if (actorId) {
      qb.andWhere(`${qb.alias}.actorId = :actorId`, { actorId });
    }

    if (targetEntity) {
      qb.andWhere(`${qb.alias}.targetEntity = :targetEntity`, { targetEntity });
    }

    if (action) {
      qb.andWhere(`${qb.alias}.action = :action`, { action });
    }

    if (targetId) {
      qb.andWhere(`${qb.alias}.targetId = :targetId`, { targetId });
    }
  }
}
