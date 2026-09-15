import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ChatController } from "./chat.controller";
import { CHAT_TYPES } from "./chat.types";
import { ChatParamsSchema, ChatQuerySchema, CreateChatSchema, UpdateChatSchema,SeenMessageSchema } from "./chat.validator";

@injectable()
export class ChatRouter {
  private router: Router;

  constructor(@inject(CHAT_TYPES.ChatController) private controller: ChatController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ChatQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
        "/seen-message",
        zodValidate(SeenMessageSchema, "body"),
        this.controller.markBookingMessagesSeen,
    );
    this.router.post(
      "/",
      zodValidate(CreateChatSchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ChatParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ChatParamsSchema, "params"),
      zodValidate(UpdateChatSchema, "body"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ChatParamsSchema, "params"),
      // permissionMiddleware("chat", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
