import { Club } from "@/database/models/Club";
import { ClubMember, MemberStatus, RoleClub } from "@/database/models/ClubMember";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { FindOptionsRelations, SelectQueryBuilder } from "typeorm";
import { ClubRelations, ClubRelationsForList, ClubSelectFull } from "./club.select";
import { ClubQueryDto } from "./club.validator";
import { ISummaryCountCase } from "@/shared/types/interfaces";

const coordinateExpression = (column: string, min: number, max: number) => `
  CASE
    WHEN ${column} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN
      CASE
        WHEN ${column}::double precision BETWEEN ${min} AND ${max}
          THEN ${column}::double precision
        ELSE NULL
      END
    ELSE NULL
  END
`;

const buildDistanceExpression = (alias: string) => `
  6371 * acos(
    LEAST(1, GREATEST(-1,
      cos(radians(:clubUserLatitude))
        * cos(radians(${coordinateExpression(`${alias}.latitude`, -90, 90)}))
        * cos(
            radians(${coordinateExpression(`${alias}.longitude`, -180, 180)})
              - radians(:clubUserLongitude)
          )
        + sin(radians(:clubUserLatitude))
          * sin(radians(${coordinateExpression(`${alias}.latitude`, -90, 90)}))
    ))
  )
`;

const openingInMonthCondition = `"entity"."openingDay" >= :openingMonthStart
  AND "entity"."openingDay" < :openingNextMonthStart`;

export class ClubRepository extends BaseRepository<Club> {
  protected entityClass = Club;
  protected selectedFields = ClubSelectFull;
  protected relations = ClubRelations;
  protected relationsForList?: FindOptionsRelations<Club> = ClubRelationsForList;
  protected summaryCountCases?: ISummaryCountCase<Club>[] = [{ field: "isActive", key: "isActive", value: true }];
  protected summaryFields?: (keyof Club | string)[] = ["openingInMonth"];
  protected summaryFieldAggregates?: Record<string, string> = {
    openingInMonth: `COUNT(DISTINCT CASE WHEN ${openingInMonthCondition} THEN "entity"."id" END)`,
  };

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Club>,
    options: IFindPaginationOptions<Club>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const query = (options.moreQuery as ClubQueryDto) || {};

    const now = new Date();
    qb.setParameters({
      openingMonthStart: new Date(now.getFullYear(), now.getMonth(), 1),
      openingNextMonthStart: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    });

    if (query.clubId) {
      qb.andWhere(`"${qb.alias}"."id" = :clubId`, { clubId: query.clubId });
    }

    if (query.clubIds) {
      if (!query.clubIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere(`"${qb.alias}"."id" IN (:...clubIds)`, { clubIds: query.clubIds });
      }
    }

    // Giữ bộ lọc chung của BaseRepository; chỉ bổ sung điều kiện khoảng cách.
    if (query.isActive !== undefined) {
      qb.andWhere(`${qb.alias}.isActive = :clubIsActive`, { clubIsActive: query.isActive });
    }

    if (query.userId) {
      if (query.isMine) {
        qb.innerJoin(
          ClubMember,
          "club_member_filter",
          `"club_member_filter"."clubId" = "${qb.alias}"."id"
            AND "club_member_filter"."userId" = :clubMemberUserId
            AND "club_member_filter"."status" = :clubMemberStatus
            AND "club_member_filter"."deletedAt" IS NULL`,
          {
            clubMemberUserId: query.userId,
            clubMemberStatus: MemberStatus.ACTIVE,
          },
        );

        if (query.isManager) {
          qb.andWhere(
            '("club_member_filter"."clubRoleId" IS NOT NULL OR "club_member_filter"."role" = :clubMemberLeaderRole)',
            { clubMemberLeaderRole: RoleClub.LEADER },
          );
        }
      } else if (query.isMine === false) {
        qb.andWhere(
          `NOT EXISTS (
            SELECT 1
            FROM "club_members" "club_member_not_mine"
            WHERE "club_member_not_mine"."clubId" = "${qb.alias}"."id"
              AND "club_member_not_mine"."userId" = :clubMemberUserId
              AND "club_member_not_mine"."status" = :clubMemberStatus
              AND "club_member_not_mine"."deletedAt" IS NULL
          )`,
          {
            clubMemberUserId: query.userId,
            clubMemberStatus: MemberStatus.ACTIVE,
          },
        );
      }
    }

    if (query.leaderIds?.length) {
      qb.andWhere(`"${qb.alias}"."leaderId" IN (:...leaderIds)`, { leaderIds: query.leaderIds });
    }

    const userLatitude = Number(query.latitude);
    const userLongitude = Number(query.longitude);
    const hasCoordinates = query.latitude !== undefined && query.longitude !== undefined;

    if (
      !hasCoordinates ||
      !Number.isFinite(userLatitude) ||
      !Number.isFinite(userLongitude) ||
      userLatitude < -90 ||
      userLatitude > 90 ||
      userLongitude < -180 ||
      userLongitude > 180
    ) {
      return;
    }

    const distance = buildDistanceExpression(qb.alias);
    qb.setParameters({ clubUserLatitude: userLatitude, clubUserLongitude: userLongitude });

    if (query.isNearby === true || query.radius !== undefined) {
      const radius = Number(query.radius ?? 10);
      if (Number.isFinite(radius) && radius > 0) {
        qb.andWhere(`${distance} <= :clubRadius`, { clubRadius: radius });
      }
    }

    // BaseRepository vẫn xử lý keyword, range filter, phân trang và các sort khác.
    // Khi không truyền sortBy, order gần nhất sẽ được giữ lại.
    if (!options.sortBy) {
      qb.orderBy(distance, "ASC", "NULLS LAST");
    }
  }
}
