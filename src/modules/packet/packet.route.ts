import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { PacketController } from "./packet.controller";
import { PACKET_TYPES } from "./packet.types";
import {
  CreatePacketSchema,
  PacketParamsSchema,
  PacketQuerySchema,
  UpdatePacketSchema,
} from "./packet.validator";

@injectable()
export class PacketRouter {
  private router: Router;

  constructor(
    @inject(PACKET_TYPES.PacketController)
    private controller: PacketController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(PacketQuerySchema, "query"),
      permissionMiddleware("packet", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreatePacketSchema, "body"),
      permissionMiddleware("packet", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(PacketParamsSchema, "params"),
      permissionMiddleware("packet", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(PacketParamsSchema, "params"),
      zodValidate(UpdatePacketSchema, "body"),
      permissionMiddleware("packet", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(PacketParamsSchema, "params"),
      permissionMiddleware("packet", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
