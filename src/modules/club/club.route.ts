import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubController } from "./club.controller";
import { CLUB_TYPES } from "./club.types";
import {
  ClubParamsSchema,
  ClubQuerySchema,
  CreateClubSchema,
  UpdateClubSchema,
  UpdateIsActiveClub,
} from "./club.validator";
import { attachLeaderIdFromAuth } from "./club.middleware";

@injectable()
export class ClubRouter {
  private router: Router;

  constructor(
    @inject(CLUB_TYPES.ClubController)
    private controller: ClubController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ClubQuerySchema, "query"),
      permissionMiddleware("club", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.post(
      "/",
      attachLeaderIdFromAuth,
      zodValidate(CreateClubSchema, "body"),
      permissionMiddleware("club", "create"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(ClubParamsSchema, "params"),
      permissionMiddleware("club", "read"),
      this.controller.getById,
    );
    this.router.put(
      "/:id/active",
      zodValidate(ClubParamsSchema, "params"),
      zodValidate(UpdateIsActiveClub, "body"),
      permissionMiddleware("club", "block"),
      this.controller.updateIsActive,
    );

    this.router.put(
      "/:id",
      zodValidate(ClubParamsSchema, "params"),
      zodValidate(UpdateClubSchema, "body"),
      permissionMiddleware("club", "update"),
      this.controller.update,
    );
    this.router.delete(
      "/:id",
      zodValidate(ClubParamsSchema, "params"),
      permissionMiddleware("club", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
