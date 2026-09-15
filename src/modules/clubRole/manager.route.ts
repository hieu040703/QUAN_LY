import { Router } from "express";
import { inject, injectable } from "inversify";
import { z } from "zod";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubRoleController } from "./clubRole.controller";
import { CLUB_ROLE_TYPES } from "./clubRole.types";
import {
  ClubRoleParamsSchema,
  ClubRoleQuerySchema,
  CreateClubRoleSchema,
  UpdateClubRoleSchema,
} from "./clubRole.validator";

const ManagerClubRoleQuerySchema = ClubRoleQuerySchema.extend({
  clubId: z.uuid().optional(),
  clubIds: z.array(z.uuid()).optional(),
});

@injectable()
export class ManagerClubRoleRouter {
  private readonly router: Router;

  constructor(@inject(CLUB_ROLE_TYPES.ClubRoleController) private readonly controller: ClubRoleController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      attachClubIsMiddleware("clubRole", "read"),
      zodValidate(ManagerClubRoleQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      clubPermissionMiddleware("clubRole", "create"),
      zodValidate(CreateClubRoleSchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      clubPermissionMiddleware("clubRole", "read", { verifyResourceClub: true }),
      zodValidate(ClubRoleParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      clubPermissionMiddleware("clubRole", "update", { verifyResourceClub: true }),
      zodValidate(ClubRoleParamsSchema, "params"),
      zodValidate(UpdateClubRoleSchema, "body"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      clubPermissionMiddleware("clubRole", "delete", { verifyResourceClub: true }),
      zodValidate(ClubRoleParamsSchema, "params"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
