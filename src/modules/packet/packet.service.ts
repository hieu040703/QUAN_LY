import { inject, injectable } from "inversify";
import { Packet } from "@/database/models/Packet";
import { BaseService } from "@/shared/base/BaseService";
import { PacketRepository } from "./packet.repository";
import { PACKET_TYPES } from "./packet.types";
import { RequestContext } from "@/shared/types/interfaces";
import { UserPacketStatus } from "@/database/models/UserPacket";
import { UserPacketRepository } from "../userPacket/userPacket.repository";
import { USER_PACKET_TYPES } from "../userPacket/userPacket.types";

@injectable()
export class PacketService extends BaseService<Packet> {
  protected repository: PacketRepository;
  protected uniqueFields: (keyof Packet)[] = ["name"];
  protected searchableFields = ["code", "name"];

  constructor(
    @inject(PACKET_TYPES.PacketRepository)
    repository: PacketRepository,
    @inject(USER_PACKET_TYPES.UserPacketRepository)
    private userPacketRepository: UserPacketRepository,
  ) {
    super();
    this.repository = repository;
  }

  protected async attachMoreDataToEntities(entities: Packet[], req?: RequestContext): Promise<void> {
    if (!entities.length) return;

    const packetIds = entities.map((packet) => packet.id).filter(Boolean);
    if (!packetIds.length) return;

    const now = new Date();
    const rows = await this.userPacketRepository
      .getRepository()
      .createQueryBuilder("userPacket")
      .select("userPacket.packetId", "packetId")
      .addSelect("COUNT(DISTINCT userPacket.userId)", "userCount")
      .where("userPacket.packetId IN (:...packetIds)", { packetIds })
      .andWhere("userPacket.status = :status", { status: UserPacketStatus.ACTIVE })
      .andWhere("userPacket.remainingQuantity > 0")
      .andWhere("userPacket.endTime > :now", { now })
      .andWhere("userPacket.deletedAt IS NULL")
      .groupBy("userPacket.packetId")
      .getRawMany<{ packetId: string; userCount: string }>();

    const userCountByPacketId = new Map(rows.map((row) => [row.packetId, Number(row.userCount)]));

    for (const packet of entities) {
      (packet as Packet & { userCount: number }).userCount = userCountByPacketId.get(packet.id) ?? 0;
    }
  }
}
