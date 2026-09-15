import { inject, injectable } from "inversify";
import { Router } from "express";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubRoleController } from "./clubRole.controller";
import { CLUB_ROLE_TYPES } from "./clubRole.types";
import {
  ClubRoleParamsSchema,
  ClubRoleQuerySchema,
  CreateClubRoleSchema,
  UpdateClubRoleSchema,
} from "./clubRole.validator";

@injectable()
export class ClubRoleRouter {
  private router: Router;

  constructor(
    @inject(CLUB_ROLE_TYPES.ClubRoleController)
    private controller: ClubRoleController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ClubRoleQuerySchema, "query"),
      permissionMiddleware("clubRole", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      zodValidate(CreateClubRoleSchema, "body"),
      permissionMiddleware("clubRole", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ClubRoleParamsSchema, "params"),
      permissionMiddleware("clubRole", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ClubRoleParamsSchema, "params"),
      zodValidate(UpdateClubRoleSchema, "body"),
      permissionMiddleware("clubRole", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ClubRoleParamsSchema, "params"),
      permissionMiddleware("clubRole", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
