import { Club } from "@/database/models/Club";
import { DatabaseConfig } from "@/config/database";
import { injectable } from "inversify";
import { ClubMapQueryDto } from "./goongMap.validator";
import { ClubMapItem, GoongMapUtils } from "./goongMap.utils";

@injectable()
export class GoongMapRepository {
  async findClubsForMap(query: ClubMapQueryDto): Promise<{ data: ClubMapItem[]; total: number }> {
    const page = query.page ?? 1;
    const size = query.size ?? 100;
    const clubQuery = DatabaseConfig.getRepository(Club)
      .createQueryBuilder("club")
      .select([
        "club.id",
        "club.code",
        "club.name",
        "club.hotline",
        "club.isActive",
        "club.address",
        "club.latitude",
        "club.longitude",
      ])
      .where("club.deletedAt IS NULL");

    if (query.clubId) {
      clubQuery.andWhere("club.id = :clubId", { clubId: query.clubId });
    } else {
      const clubIds = (query as ClubMapQueryDto & { clubIds?: string[] }).clubIds;
      if (clubIds) {
        if (!clubIds.length) {
          clubQuery.andWhere("1 = 0");
        } else {
          clubQuery.andWhere("club.id IN (:...clubIds)", { clubIds });
        }
      }
    }

    if (query.isActive !== undefined) {
      clubQuery.andWhere("club.isActive = :isActive", { isActive: query.isActive });
    }

    if (query.keyword) {
      clubQuery.andWhere(
        "(club.name ILIKE :keyword OR club.code ILIKE :keyword OR club.hotline ILIKE :keyword)",
        { keyword: `%${query.keyword}%` },
      );
    }

    const [clubs, total] = await clubQuery
      .orderBy("club.name", "ASC")
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();

    return {
      data: clubs.map((club) => GoongMapUtils.transformClubToMapItem(club)),
      total,
    };
  }
}
