import { NextFunction, Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { UserTargetController } from "./userTarget.controller";
import { USER_TARGET_TYPES } from "./userTarget.types";
import {
  CreateUserTargetSchema,
  UpdateUserTargetSchema,
  UserTargetParamsSchema,
  UserTargetQuerySchema,
} from "./userTarget.validator";
import { UnauthorizedError } from "@/shared/types/errors";

@injectable()
export class UserTargetRouter {
  private router: Router;

  constructor(
    @inject(USER_TARGET_TYPES.UserTargetController)
    private controller: UserTargetController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(UserTargetQuerySchema, "query"),
      permissionMiddleware("userTarget", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.get(
        "/:id/summary",
        zodValidate(UserTargetParamsSchema, "params"),
        permissionMiddleware("userTarget", "read"),
        this.controller.getSummary,
    );
    this.router.post(
      "/",
      zodValidate(CreateUserTargetSchema, "body"),
      permissionMiddleware("userTarget", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(UserTargetParamsSchema, "params"),
      permissionMiddleware("userTarget", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(UserTargetParamsSchema, "params"),
      zodValidate(UpdateUserTargetSchema, "body"),
      permissionMiddleware("userTarget", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(UserTargetParamsSchema, "params"),
      permissionMiddleware("userTarget", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
