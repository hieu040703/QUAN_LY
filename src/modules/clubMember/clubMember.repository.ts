import { ClubMember, MemberStatus } from "@/database/models/ClubMember";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { ClubMemberListRelations, ClubMemberRelations, ClubMemberSelectFull } from "./clubMember.select";
import { FindOptionsRelations, SelectQueryBuilder } from "typeorm";
import { ClubMemberQueryDto } from "./clubMember.validator";
import { ISummaryCountCase } from "@/shared/types/interfaces";

export class ClubMemberRepository extends BaseRepository<ClubMember> {
  protected entityClass = ClubMember;
  protected selectedFields = ClubMemberSelectFull;
  protected relations = ClubMemberRelations;
  protected relationsForList?: FindOptionsRelations<ClubMember> = ClubMemberListRelations;
  protected summaryCountCases?: ISummaryCountCase<ClubMember>[] = [
    { field: "status", key: "totalPending", value: MemberStatus.PENDING },
    { field: "status", key: "totalActive", value: MemberStatus.ACTIVE },
    { field: "status", key: "totalBlocked", value: MemberStatus.BLOCKED },
    { field: "status", key: "totalOut", value: MemberStatus.OUT },
  ];

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<ClubMember>,
    options: IFindPaginationOptions<ClubMember>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const { clubId, clubIds, packetId, packetIds, clubMemberIds, role, birthdayInMonth } =
      (options.moreQuery as ClubMemberQueryDto & { clubIds?: string[]; packetIds?: string[] }) || {};

    if (clubId) {
      qb.andWhere("entity.clubId = :clubId", { clubId });
    } else if (clubIds) {
      if (!clubIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere("entity.clubId IN (:...clubIds)", { clubIds });
      }
    }
    const filterPacketIds = packetId ? [packetId] : packetIds;
    if (filterPacketIds) {
      if (!filterPacketIds.length) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere(
          `EXISTS (
            SELECT 1 FROM user_packets up
            WHERE up."userId" = entity."userId"
              AND up."clubId" = entity."clubId"
              AND up."packetId" IN (:...filterPacketIds)
              AND up."deletedAt" IS NULL
          )`,
          { filterPacketIds },
        );
      }
    }

    if (clubMemberIds?.length) {
      qb.andWhere("entity.id IN (:...clubMemberIds)", { clubMemberIds });
    }

    if (role) {
      qb.andWhere("entity.role = :role", { role });
    }

    if (birthdayInMonth !== undefined) {
      qb.andWhere("EXTRACT(MONTH FROM entity_user.dob) = :birthdayInMonth", { birthdayInMonth });
    }
  }
}
