import { ClubRole } from "@/database/models/ClubRole";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { ClubRoleRelations, ClubRoleSelectFull } from "./clubRole.select";

export class ClubRoleRepository extends BaseRepository<ClubRole> {
  protected entityClass = ClubRole;
  protected selectedFields = ClubRoleSelectFull;
  protected relations = ClubRoleRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ClubRole>,
    options: IFindPaginationOptions<ClubRole>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);
    const alias = qb.alias;
    const query = (options.moreQuery || {}) as { clubId?: string; clubIds?: string[] };

    if (query.clubId) {
      qb.andWhere(`${alias}.clubId = :clubId`, { clubId: query.clubId });
    } else if (query.clubIds) {
      if (query.clubIds.length === 0) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere(`${alias}.clubId IN (:...clubIds)`, { clubIds: query.clubIds });
      }
    }

    qb.loadRelationCountAndMap(`${alias}.memberCount`, `${alias}.member`);
  }
}
