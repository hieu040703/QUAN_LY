import { ContainerModule } from "inversify";
import { PacketController } from "./packet.controller";
import { PacketRepository } from "./packet.repository";
import { PacketRouter } from "./packet.route";
import { ManagerPacketRouter } from "./manager.route";
import { UserPacketRouter } from "./user.route";
import { PacketService } from "./packet.service";
import { PACKET_TYPES } from "./packet.types";

export const packetModule = new ContainerModule((bind) => {
  bind<PacketRepository>(PACKET_TYPES.PacketRepository).to(PacketRepository);
  bind<PacketService>(PACKET_TYPES.PacketService).to(PacketService);
  bind<PacketController>(PACKET_TYPES.PacketController).to(PacketController);
  bind<PacketRouter>(PACKET_TYPES.PacketRouter).to(PacketRouter);
  bind<ManagerPacketRouter>(PACKET_TYPES.ManagerPacketRouter).to(ManagerPacketRouter);
  bind<UserPacketRouter>(PACKET_TYPES.PacketUserRouter).to(UserPacketRouter);
});
