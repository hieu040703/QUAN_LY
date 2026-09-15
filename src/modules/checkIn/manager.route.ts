import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { CheckInController } from "./checkIn.controller";
import { CHECK_IN_TYPES } from "./checkIn.types";
import {
  CheckInParamsSchema,
  CheckInQuerySchema,
  CheckInReportQuerySchema,
  CheckInTopMembersQuerySchema,
  CreateCheckInSchema,
} from "./checkIn.validator";

@injectable()
export class ManagerCheckInRouter {
  private readonly router: Router;

  constructor(@inject(CHECK_IN_TYPES.CheckInController) private readonly controller: CheckInController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/top-members",
      clubPermissionMiddleware("checkIn", "read"),
      zodValidate(CheckInTopMembersQuerySchema, "query"),
      this.controller.topMembers,
    );
    this.router.get(
      "/report",
      clubPermissionMiddleware("checkIn", "read"),
      zodValidate(CheckInReportQuerySchema, "query"),
      this.controller.report,
    );
    this.router.get(
      "/",
      clubPermissionMiddleware("checkIn", "read"),
      zodValidate(CheckInQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/:id/paid",
      clubPermissionMiddleware("checkIn", "update", { verifyResourceClub: true }),
      this.controller.collectCheckIn,
    );
    // this.router.post(
    //   "/:id/collect",
    //   clubPermissionMiddleware("checkIn", "update", { verifyResourceClub: true }),
    //   zodValidate(CheckInParamsSchema, "params"),
    //   this.controller.collectCheckIn,
    // );
    this.router.post(
      "/",
      clubPermissionMiddleware("checkIn", "create"),
      zodValidate(CreateCheckInSchema, "body"),
      this.controller.create,
    );
    this.router.delete(
      "/:id",
      zodValidate(CheckInParamsSchema, "params"),
      clubPermissionMiddleware("checkIn", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
