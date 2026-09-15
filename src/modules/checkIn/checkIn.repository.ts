import { CheckIn, CheckInDirection } from "@/database/models/CheckIn";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { CheckInRelations, CheckInSelectFull } from "./checkIn.select";
import { SelectQueryBuilder } from "typeorm";
import { CheckInQueryDto } from "./checkIn.validator";

export type CheckInReportQuery = Partial<CheckInQueryDto> & {
  /** CLB duy nhất thuộc phạm vi của tài khoản đang xem báo cáo. */
  reportClubId?: string;
  reportDirection?: CheckInDirection;
};

export type TopCheckInMember = {
  userId: string;
  code: string | null;
  name: string;
  checkInCount: number;
  totalQuantity: number;
};

export class CheckInRepository extends BaseRepository<CheckIn> {
  protected entityClass = CheckIn;
  protected selectedFields = CheckInSelectFull;
  protected relations = CheckInRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<CheckIn>,
    options: IFindPaginationOptions<CheckIn>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);
    const { userId, userIds, clubId, clubIds, reportClubId, reportDirection, paid } =
      (options.moreQuery as CheckInReportQuery) || {};

    if (userId) qb.andWhere("entity.userId = :userId", { userId });

    if (userIds?.length) {
      qb.andWhere("entity.userId IN (:...userIds)", { userIds });
    }

    if (clubId) {
      qb.andWhere("entity.clubId = :clubId", { clubId });
    } else if (clubIds) {
      if (!clubIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere("entity.clubId IN(:...clubIds)", { clubIds });
      }
    }

    if (reportDirection) {
      if (!reportClubId) {
        qb.andWhere("1 = 0");
        return;
      }

      qb.innerJoin("entity.userPacket", "reportUserPacket");

      // in: người dùng check-in tại CLB của mình bằng gói của CLB khác => cần thu.
      // out: người dùng dùng gói của CLB mình tại CLB khác => cần trả.
      qb.andWhere(
        reportDirection === CheckInDirection.IN
          ? "entity.clubId = :reportClubId"
          : "reportUserPacket.clubId = :reportClubId",
        { reportClubId },
      );
      qb.andWhere("reportUserPacket.clubId <> entity.clubId");
      // Check-ins using free packages do not create any receivable/payable cost.
      qb.andWhere("entity.amount > 0");
    }
    if (paid !== undefined) {
      qb.andWhere("entity.paid = :paid", { paid });
    }
  }

  async getTopMembersByClub(clubId: string, startAt?: Date, endAt?: Date, limit = 5): Promise<TopCheckInMember[]> {
    const qb = this.getRepository()
      .createQueryBuilder("ci")
      .innerJoin("ci.user", "u")
      .select("ci.userId", "userId")
      .addSelect("u.code", "userCode")
      .addSelect("u.name", "userName")
      .addSelect("COUNT(ci.id)", "checkInCount")
      .addSelect("COALESCE(SUM(ci.quantity), 0)", "totalQuantity")
      .where("ci.clubId = :clubId", { clubId })
      .groupBy("ci.userId")
      .addGroupBy("u.code")
      .addGroupBy("u.name")
      .orderBy("SUM(ci.quantity)", "DESC")
      .addOrderBy("COUNT(ci.id)", "DESC")
      .addOrderBy("u.name", "ASC")
      .limit(limit);

    if (startAt) {
      qb.andWhere("ci.createdAt >= :startAt", { startAt });
    }
    if (endAt) {
      qb.andWhere("ci.createdAt <= :endAt", { endAt });
    }

    const rows = await qb.getRawMany<{
      userId: string;
      userCode: string | null;
      userName: string;
      checkInCount: string;
      totalQuantity: string;
    }>();

    return rows.map((row) => ({
      userId: row.userId,
      code: row.userCode ?? null,
      name: row.userName,
      checkInCount: Number(row.checkInCount),
      totalQuantity: Number(row.totalQuantity),
    }));
  }
}
