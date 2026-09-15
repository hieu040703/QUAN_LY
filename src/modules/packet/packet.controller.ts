import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { Packet } from "@/database/models/Packet";
import { PacketService } from "./packet.service";
import { PACKET_TYPES } from "./packet.types";

@injectable()
export class PacketController extends BaseController<Packet> {
  protected service: PacketService;

  constructor(
    @inject(PACKET_TYPES.PacketService)
    service: PacketService,
  ) {
    super();
    this.service = service;
  }
}
