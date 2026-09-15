import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { PacketController } from "./packet.controller";
import { PACKET_TYPES } from "./packet.types";
import { PacketParamsSchema, PacketQuerySchema } from "./packet.validator";

@injectable()
export class UserPacketRouter {
  private router: Router;

  constructor(
    @inject(PACKET_TYPES.PacketController)
    private controller: PacketController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(PacketQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.get(
      "/:id",
      zodValidate(PacketParamsSchema, "params"),
      this.controller.getById,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
