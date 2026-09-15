import { UserTarget } from "@/database/models/UserTarget";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { UserTargetRelations, UserTargetSelectFull } from "./userTarget.select";
import { SelectQueryBuilder } from "typeorm";
import { UserTargetQueryDto } from "./userTarget.validator";

export class UserTargetRepository extends BaseRepository<UserTarget> {
  protected entityClass = UserTarget;
  protected selectedFields = UserTargetSelectFull;
  protected relations = UserTargetRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<UserTarget>,
    options: IFindPaginationOptions<UserTarget>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);
    const { userId } = (options.moreQuery as UserTargetQueryDto) || {};

    if (userId) {
      qb.andWhere("entity.userId = :userId", { userId });
    }
  }
}
