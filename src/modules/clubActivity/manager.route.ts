import { Router } from "express";
import { inject, injectable } from "inversify";
import { z } from "zod";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { ClubActivityController } from "./clubActivity.controller";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";
import {
  ClubActivityParamsSchema,
  ClubActivityQuerySchema,
  CreateClubActivitySchema,
  UpdateClubActivitySchema,
} from "./clubActivity.validator";

const ManagerCreateClubActivitySchema = CreateClubActivitySchema.extend({ clubId: z.uuid() });
const ManagerUpdateClubActivitySchema = UpdateClubActivitySchema.extend({ clubId: z.uuid() });

@injectable()
export class ManagerClubActivityRouter {
  private readonly router: Router;

  constructor(@inject(CLUB_ACTIVITY_TYPES.ClubActivityController) private readonly controller: ClubActivityController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      clubPermissionMiddleware("club", "read"),
      zodValidate(ClubActivityQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      clubPermissionMiddleware("clubActivity", "create"),
      zodValidate(ManagerCreateClubActivitySchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      clubPermissionMiddleware("clubActivity", "read", { verifyResourceClub: true }),
      zodValidate(ClubActivityParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      clubPermissionMiddleware("clubActivity", "update", { verifyResourceClub: true }),
      zodValidate(ClubActivityParamsSchema, "params"),
      zodValidate(ManagerUpdateClubActivitySchema, "body"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      clubPermissionMiddleware("clubActivity", "delete", { verifyResourceClub: true }),
      zodValidate(ClubActivityParamsSchema, "params"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
