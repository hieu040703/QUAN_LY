import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { attachUserIdIfNoPermission } from "@/shared/middleware/userId.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { SeenMessageController } from "./seenMessage.controller";
import { SEEN_MESSAGE_TYPES } from "./seenMessage.types";
import {
  CreateSeenMessageSchema,
  SeenMessageParamsSchema,
  SeenMessageQuerySchema,
  UpdateSeenMessageSchema,
} from "./seenMessage.validator";

@injectable()
export class SeenMessageRouter {
  private router: Router;

  constructor(@inject(SEEN_MESSAGE_TYPES.SeenMessageController) private controller: SeenMessageController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      attachUserIdIfNoPermission("seenMessage", "read", "query"),
      zodValidate(SeenMessageQuerySchema, "query"),
      permissionMiddleware("seenMessage", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      attachUserIdIfNoPermission("seenMessage", "create", "body"),
      zodValidate(CreateSeenMessageSchema, "body"),
      permissionMiddleware("seenMessage", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(SeenMessageParamsSchema, "params"),
      permissionMiddleware("seenMessage", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(SeenMessageParamsSchema, "params"),
      zodValidate(UpdateSeenMessageSchema, "body"),
      permissionMiddleware("seenMessage", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(SeenMessageParamsSchema, "params"),
      permissionMiddleware("seenMessage", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
