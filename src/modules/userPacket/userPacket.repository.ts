import { UserPacket, UserPacketStatus } from "@/database/models/UserPacket";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { UserPacketRelations, UserPacketSelectFull } from "./userPacket.select";
import { UserPacketQueryDto } from "./userPacket.validator";
import { EntityManager, SelectQueryBuilder } from "typeorm";

export type UserPacketStatusSummary = {
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  totalCount: number;
};

type UserPacketFilter = {
  clubId?: string;
  clubIds?: string[];
  userId?: string;
  userIds?: string[];
  packetId?: string;
  packetIds?: string[];
};

export class UserPacketRepository extends BaseRepository<UserPacket> {
  protected entityClass = UserPacket;
  protected selectedFields = UserPacketSelectFull;
  protected relations = UserPacketRelations;

  override async findWithPagination(
    options: IFindPaginationOptions<UserPacket>,
    manager?: EntityManager,
    includeDeleted = false,
  ) {
    const virtualStatuses = ["all", "expiring", "expired", "end"];
    const status = options.status as string | undefined;

    if (status && virtualStatuses.includes(status)) {
      return super.findWithPagination({ ...options, status: undefined }, manager, includeDeleted);
    }

    return super.findWithPagination(options, manager, includeDeleted);
  }

  private applyFilters(qb: SelectQueryBuilder<UserPacket>, f: UserPacketFilter): void {
    if (f.clubId) qb.andWhere("entity.clubId = :clubId", { clubId: f.clubId });
    else if (f.clubIds)
      qb.andWhere(f.clubIds.length ? "entity.clubId IN (:...clubIds)" : "1 = 0", { clubIds: f.clubIds });

    if (f.userId) qb.andWhere("entity.userId = :userId", { userId: f.userId });
    else if (f.userIds)
      qb.andWhere(f.userIds.length ? "entity.userId IN (:...userIds)" : "1 = 0", { userIds: f.userIds });

    if (f.packetId) qb.andWhere("entity.packetId = :packetId", { packetId: f.packetId });
    else if (f.packetIds)
      qb.andWhere(f.packetIds.length ? "entity.packetId IN (:...packetIds)" : "1 = 0", { packetIds: f.packetIds });
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<UserPacket>,
    options: IFindPaginationOptions<UserPacket>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const query = (options.moreQuery || {}) as UserPacketQueryDto & UserPacketFilter & { status?: string };
    this.applyFilters(qb, query);

    if (!query.status || query.status === "all") return;

    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 3);

    if (query.status === "active") {
      qb.andWhere("entity.status = :pStatus AND entity.endTime > :now", {
        pStatus: UserPacketStatus.ACTIVE,
        now,
      });
    } else if (query.status === "expiring") {
      qb.andWhere("entity.status = :pStatus AND entity.endTime > :now AND entity.endTime <= :soonThreshold", {
        pStatus: UserPacketStatus.ACTIVE,
        now,
        soonThreshold,
      });
    } else if (query.status === "expired" || query.status === "end") {
      qb.andWhere("(entity.status != :pStatus OR entity.endTime <= :now)", {
        pStatus: UserPacketStatus.ACTIVE,
        now,
      });
    }
  }

  async getStatusSummary(filter: UserPacketFilter): Promise<UserPacketStatusSummary> {
    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 3);

    const qb = this.getRepository().createQueryBuilder("entity").where("entity.deletedAt IS NULL");
    this.applyFilters(qb, filter);

    const raw = await qb
      .select("COUNT(*)", "totalCount")
      .addSelect(
            `COUNT(*) FILTER (WHERE entity.status = :activeStatus AND entity."endTime" > :now)`,
            "activeCount",
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE entity.status = :activeStatus AND entity."endTime" > :now AND entity."endTime" <= :soonThreshold)`,
        "expiringCount",
      )
      .addSelect(`COUNT(*) FILTER (WHERE entity.status != :activeStatus OR entity."endTime" <= :now)`, "expiredCount")
      .setParameters({ activeStatus: UserPacketStatus.ACTIVE, now, soonThreshold })
      .getRawOne<{ totalCount: string; activeCount: string; expiringCount: string; expiredCount: string }>();

    return {
      totalCount: Number(raw?.totalCount ?? 0),
      activeCount: Number(raw?.activeCount ?? 0),
      expiringCount: Number(raw?.expiringCount ?? 0),
      expiredCount: Number(raw?.expiredCount ?? 0),
    };
  }
}
