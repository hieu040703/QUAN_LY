import { inject, injectable } from "inversify";
import { Router } from "express";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { NotificationController } from "./notification.controller";
import { NOTIFICATION_TYPES } from "./notification.types";
import { SendNotificationSchema } from "./notification.validator";

@injectable()
export class NotificationRouter {
  private router = Router();

  constructor(
    @inject(NOTIFICATION_TYPES.NotificationController)
    private controller: NotificationController,
  ) {
    this.router.post(
      "/send",
      zodValidate(SendNotificationSchema, "body"),
      permissionMiddleware("notification", "create"),
      this.controller.send,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
