import { Packet } from "@/database/models/Packet";
import { BaseRepository } from "@/shared/base/BaseRepository";
import { PacketRelations, PacketSelectFull } from "./packet.select";

export class PacketRepository extends BaseRepository<Packet> {
  protected entityClass = Packet;
  protected selectedFields = PacketSelectFull;
  protected relations = PacketRelations;
}
