import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { UserPacketController } from "./userPacket.controller";
import { USER_PACKET_TYPES } from "./userPacket.types";
import {
  CreateUserPacketSchema,
  UpdateUserPacketSchema,
  UserPacketParamsSchema,
  UserPacketQuerySchema,
} from "./userPacket.validator";

@injectable()
export class UserPacketRouter {
  private router: Router;

  constructor(
    @inject(USER_PACKET_TYPES.UserPacketController)
    private controller: UserPacketController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/byUser/:userId", permissionMiddleware("checkIn", "create"), this.controller.getByUserId);

    this.router.get(
      "/",
      zodValidate(UserPacketQuerySchema, "query"),
      permissionMiddleware("userPacket", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      zodValidate(CreateUserPacketSchema, "body"),
      permissionMiddleware("userPacket", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(UserPacketParamsSchema, "params"),
      permissionMiddleware("userPacket", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(UserPacketParamsSchema, "params"),
      zodValidate(UpdateUserPacketSchema, "body"),
      permissionMiddleware("userPacket", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(UserPacketParamsSchema, "params"),
      permissionMiddleware("userPacket", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
