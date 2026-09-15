import { ClubActivity } from "@/database/models/ClubActivity";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { ClubActivityRelations, ClubActivitySelectFull } from "./clubActivity.select";
import { ClubActivityQueryDto } from "./clubActivity.validator";
import { SelectQueryBuilder } from "typeorm";

export class ClubActivityRepository extends BaseRepository<ClubActivity> {
  protected entityClass = ClubActivity;
  protected selectedFields = ClubActivitySelectFull;
  protected relations = ClubActivityRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ClubActivity>,
    options: IFindPaginationOptions<ClubActivity>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const query = (options.moreQuery || {}) as ClubActivityQueryDto & { clubIds?: string[] };
    if (query.clubId) {
      qb.andWhere("entity.clubId = :clubId", { clubId: query.clubId });
    } else if (query.clubIds) {
      if (!query.clubIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere("entity.clubId IN (:...clubIds)", { clubIds: query.clubIds });
      }
    }
  }
}
