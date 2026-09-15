import { Booking, BookingStatus } from "@/database/models/Booking";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { BookingRelations, BookingSelectFull } from "./booking.select";
import { SelectQueryBuilder } from "typeorm";
import { BookingQueryDto } from "./booking.validator";
import { ISummaryCountCase } from "@/shared/types/interfaces";

export class BookingRepository extends BaseRepository<Booking> {
  protected entityClass = Booking;
  protected selectedFields = BookingSelectFull;
  protected relations = BookingRelations;
  protected summaryCountCases?: ISummaryCountCase<Booking>[] = [
    { field: "status", key: "totalPending", value: BookingStatus.PENDING },
    { field: "status", key: "totalConfirmed", value: BookingStatus.CONFIRMED },
    { field: "status", key: "totalCheckedIn", value: BookingStatus.CHECKED_IN },
    { field: "status", key: "totalCanceled", value: BookingStatus.CANCELED },
  ];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Booking>,
    options: IFindPaginationOptions<Booking>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const { userId, userIds, clubId, clubIds } = (options.moreQuery as BookingQueryDto) || {};

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
        qb.andWhere("entity.clubId IN (:...clubIds)", { clubIds });
      }
    }
  }
}
