import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { PacketController } from "./packet.controller";
import { PACKET_TYPES } from "./packet.types";
import { CreatePacketSchema, PacketParamsSchema, PacketQuerySchema, UpdatePacketSchema } from "./packet.validator";
import { clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";

@injectable()
export class ManagerPacketRouter {
  private readonly router: Router;

  constructor(
    @inject(PACKET_TYPES.PacketController)
    private readonly controller: PacketController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PacketQuerySchema, "query"),
      clubPermissionMiddleware("userPacket", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.get(
      "/:id",
      zodValidate(PacketParamsSchema, "params"),
      clubPermissionMiddleware("userPacket", "read"),
      this.controller.getById,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
