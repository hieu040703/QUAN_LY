import { ContainerModule } from "inversify";
import { UserPacketController } from "./userPacket.controller";
import { UserPacketRepository } from "./userPacket.repository";
import { UserPacketRouter } from "./userPacket.route";
import { UserUserPacketRouter } from "./user.route";
import { ManagerUserPacketRouter } from "./manager.route";
import { UserPacketService } from "./userPacket.service";
import { USER_PACKET_TYPES } from "./userPacket.types";

export const userPacketModule = new ContainerModule((bind) => {
  bind<UserPacketRepository>(USER_PACKET_TYPES.UserPacketRepository).to(UserPacketRepository);
  bind<UserPacketService>(USER_PACKET_TYPES.UserPacketService).to(UserPacketService);
  bind<UserPacketController>(USER_PACKET_TYPES.UserPacketController).to(UserPacketController);
  bind<UserPacketRouter>(USER_PACKET_TYPES.UserPacketRouter).to(UserPacketRouter);
  bind<UserUserPacketRouter>(USER_PACKET_TYPES.UserUserPacketRouter).to(UserUserPacketRouter);
  bind<ManagerUserPacketRouter>(USER_PACKET_TYPES.ManagerUserPacketRouter).to(ManagerUserPacketRouter);
});
