import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubActivityController } from "./clubActivity.controller";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";
import { ClubActivityParamsSchema, ClubActivityQuerySchema } from "./clubActivity.validator";

@injectable()
export class UserClubActivityRouter {
  private router: Router;

  constructor(
    @inject(CLUB_ACTIVITY_TYPES.ClubActivityController)
    private controller: ClubActivityController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(ClubActivityQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.get(
      "/:id",
      zodValidate(ClubActivityParamsSchema, "params"),
      this.controller.getById,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
