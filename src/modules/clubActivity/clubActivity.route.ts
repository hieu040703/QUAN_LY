import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubActivityController } from "./clubActivity.controller";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";
import {
  ClubActivityParamsSchema,
  ClubActivityQuerySchema,
  CreateClubActivitySchema,
  UpdateClubActivitySchema,
} from "./clubActivity.validator";

@injectable()
export class ClubActivityRouter {
  private router: Router;

  constructor(
    @inject(CLUB_ACTIVITY_TYPES.ClubActivityController)
    private controller: ClubActivityController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ClubActivityQuerySchema, "query"),
      permissionMiddleware("clubActivity", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreateClubActivitySchema, "body"),
      permissionMiddleware("clubActivity", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ClubActivityParamsSchema, "params"),
      permissionMiddleware("clubActivity", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ClubActivityParamsSchema, "params"),
      zodValidate(UpdateClubActivitySchema, "body"),
      permissionMiddleware("clubActivity", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ClubActivityParamsSchema, "params"),
      permissionMiddleware("clubActivity", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
