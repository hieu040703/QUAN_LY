import { Router } from "express";
import { inject, injectable } from "inversify";
import { z } from "zod";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { ClubController } from "./club.controller";
import { CLUB_TYPES } from "./club.types";
import { ClubParamsSchema, ClubQuerySchema, CreateClubSchema, UpdateClubSchema } from "./club.validator";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { attachLeaderIdFromAuth, checkLeaderClub } from "./club.middleware";

const ManagerClubQuerySchema = ClubQuerySchema.extend({ clubId: z.uuid().optional() });

@injectable()
export class ManagerClubRouter {
  private readonly router: Router;

  constructor(@inject(CLUB_TYPES.ClubController) private readonly controller: ClubController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      attachClubIsMiddleware("club", "read"),
      zodValidate(ManagerClubQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.get(
      "/my-club",
      attachClubIsMiddleware("club", "read"),
      zodValidate(ManagerClubQuerySchema, "query"),
      this.controller.getMyClub,
    );
    this.router.get(
      "/:id",
      clubPermissionMiddleware("club", "read"),
      zodValidate(ClubParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ClubParamsSchema, "params"),
      checkLeaderClub,
      zodValidate(UpdateClubSchema, "body"),
      this.controller.update,
    );
    this.router.post("/", attachLeaderIdFromAuth, zodValidate(CreateClubSchema, "body"), this.controller.create);
    this.router.delete("/:id", zodValidate(ClubParamsSchema, "params"), checkLeaderClub, this.controller.delete);
  }

  getRouter(): Router {
    return this.router;
  }
}
