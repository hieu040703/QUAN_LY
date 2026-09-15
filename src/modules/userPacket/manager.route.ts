import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { UserPacketController } from "./userPacket.controller";
import { USER_PACKET_TYPES } from "./userPacket.types";
import {
  CreateUserPacketSchema,
  UpdateUserPacketSchema,
  UserPacketParamsSchema,
  UserPacketQuerySchema,
} from "./userPacket.validator";

@injectable()
export class ManagerUserPacketRouter {
  private readonly router: Router;

  constructor(@inject(USER_PACKET_TYPES.UserPacketController) private readonly controller: UserPacketController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/by-user/:userId", clubPermissionMiddleware("checkIn", "create"), this.controller.getByUserId);
    this.router.get(
      "/",
      clubPermissionMiddleware("userPacket", "read"),
      zodValidate(UserPacketQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      clubPermissionMiddleware("userPacket", "create"),
      zodValidate(CreateUserPacketSchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      clubPermissionMiddleware("userPacket", "read", { verifyResourceClub: true }),
      zodValidate(UserPacketParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      clubPermissionMiddleware("userPacket", "update", { verifyResourceClub: true }),
      zodValidate(UserPacketParamsSchema, "params"),
      zodValidate(UpdateUserPacketSchema, "body"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      clubPermissionMiddleware("userPacket", "delete", { verifyResourceClub: true }),
      zodValidate(UserPacketParamsSchema, "params"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
