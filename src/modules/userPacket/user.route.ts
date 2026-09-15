import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { UserPacketController } from "./userPacket.controller";
import { USER_PACKET_TYPES } from "./userPacket.types";
import { UserPacketQuerySchema } from "./userPacket.validator";

@injectable()
export class UserUserPacketRouter {
  private router: Router;

  constructor(
    @inject(USER_PACKET_TYPES.UserPacketController)
    private controller: UserPacketController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(UserPacketQuerySchema, "query"), this.controller.getAllWithPagination);
  }

  getRouter(): Router {
    return this.router;
  }
}
