import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { ClubController } from "./club.controller";
import { CLUB_TYPES } from "./club.types";
import { ClubParamsSchema, ClubQuerySchema } from "./club.validator";

@injectable()
export class UserClubRouter {
  private router: Router;

  constructor(
    @inject(CLUB_TYPES.ClubController)
    private controller: ClubController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(ClubQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.get("/my-club", zodValidate(ClubQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.get("/:id", zodValidate(ClubParamsSchema, "params"), this.controller.getById);
  }

  getRouter(): Router {
    return this.router;
  }
}
