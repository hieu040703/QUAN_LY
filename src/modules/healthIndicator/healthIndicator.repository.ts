import { HealthIndicator } from "@/database/models/HealthIndicator";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { HealthIndicatorRelations, HealthIndicatorSelectFull } from "./healthIndicator.select";
import { HealthIndicatorChartField } from "./healthIndicator.types";
import { SelectQueryBuilder } from "typeorm";
import { HealthIndicatorQueryDto } from "./healthIndicator.validator";

export class HealthIndicatorRepository extends BaseRepository<HealthIndicator> {
  protected entityClass = HealthIndicator;
  protected selectedFields = HealthIndicatorSelectFull;
  protected relations = HealthIndicatorRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<HealthIndicator>,
    options: IFindPaginationOptions<HealthIndicator>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);
    const { userId } = (options.moreQuery as HealthIndicatorQueryDto) || {};

    if (userId) {
      qb.andWhere("entity.userId = :userId", { userId });
    }
  }

  async getChartData(userId: string, field: HealthIndicatorChartField, limit: number) {
    const repo = this.getRepository();

    const rows = await repo
      .createQueryBuilder("entity")
      .select([`entity.createdAt AS "date"`, `entity.${field} AS "value"`])
      .where("entity.userId = :userId", { userId })
      .andWhere("entity.deletedAt IS NULL")
      .andWhere(`entity.${field} IS NOT NULL`)
      .orderBy("entity.createdAt", "DESC")
      .limit(limit)
      .getRawMany<{ date: Date; value: string | number }>();

    return rows.reverse();
  }
}
