import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { User } from "@/database/models/User";
import { UserSelectFull, UserRelations } from "./user.select";
import { EntityManager, SelectQueryBuilder } from "typeorm";
import { UserSnapshot } from "@/shared/base/BaseEntity";
import { getUserSnapshot } from "@/shared/utils/utils";
import { UserQueryDto } from "./user.validator";

export class UserRepository extends BaseRepository<User> {
  protected entityClass = User;
  protected selectedFields = UserSelectFull;
  protected relations = UserRelations;

  protected async extendQueryBuilderForList(
    qb: SelectQueryBuilder<User>,
    options: IFindPaginationOptions<User>,
  ): Promise<void> {
    await super.extendQueryBuilderForList(qb, options);

    qb.andWhere("entity.username != :admin", { admin: "admin" });
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<User>,
    options: IFindPaginationOptions<User>,
  ): Promise<void> {
    await super.extendQueryBuilder?.(qb, options);
    const moreQuery = (options.moreQuery as UserQueryDto) || {};
    const { isManager } = moreQuery;

    if (isManager !== undefined) {
      qb.andWhere(isManager ? "entity.roleId IS NOT NULL" : "entity.roleId IS NULL");
    }

  }

  async getSnapshot(userId: string, manager?: EntityManager): Promise<UserSnapshot | null> {
    const user = await this.findById(userId, manager);
    if (!user) return null;

    return getUserSnapshot(user);
  }
}
