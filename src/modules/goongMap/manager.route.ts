import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { GoongMapController } from "./goongMap.controller";
import { GoongMapRouter } from "./goongMap.route";
import { GOONG_MAP_TYPES } from "./goongMap.types";
import { ClubMapQuerySchema } from "./goongMap.validator";

@injectable()
export class ManagerGoongMapRouter {
  private readonly router: Router;

  constructor(
    @inject(GOONG_MAP_TYPES.GoongMapController) private readonly controller: GoongMapController,
    @inject(GOONG_MAP_TYPES.GoongMapRouter) private readonly goongMapRouter: GoongMapRouter,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/clubs",
      attachClubIsMiddleware("club", "read"),
      zodValidate(ClubMapQuerySchema, "query"),
      this.controller.getClubsForMap,
    );

    // Reuse the generic Goong endpoints after the manager-specific club list.
    this.router.use(this.goongMapRouter.getRouter());
  }

  getRouter(): Router {
    return this.router;
  }
}
