import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { CheckInController } from "./checkIn.controller";
import { CHECK_IN_TYPES } from "./checkIn.types";
import {
  CheckInParamsSchema,
  CheckInQuerySchema,
  CheckInReportQuerySchema,
  CheckInTopMembersQuerySchema,
  CreateCheckInSchema,
  CreateUserCheckInSchema,
  UpdateCheckInSchema,
} from "./checkIn.validator";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";

@injectable()
export class CheckInRouter {
  private router: Router;

  constructor(
    @inject(CHECK_IN_TYPES.CheckInController)
    private controller: CheckInController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/top-members",
      zodValidate(CheckInTopMembersQuerySchema, "query"),
      permissionMiddleware("checkIn", "read"),
      this.controller.topMembers,
    );
    this.router.get(
      "/report",
      zodValidate(CheckInReportQuerySchema, "query"),
      permissionMiddleware("checkIn", "read"),
      this.controller.report,
    );
    this.router.get(
      "/",
      zodValidate(CheckInQuerySchema, "query"),
      permissionMiddleware("checkIn", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/",
      permissionMiddleware("checkIn", "create"),
      zodValidate(CreateCheckInSchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      zodValidate(CheckInParamsSchema, "params"),
      permissionMiddleware("checkIn", "read"),
      this.controller.getById,
    );
    // this.router.put(
    //   "/:id",
    //   zodValidate(CheckInParamsSchema, "params"),
    //   zodValidate(UpdateCheckInSchema, "body"),
    //   permissionMiddleware("checkIn", "update"),
    //   this.controller.update,
    // );
    this.router.delete(
      "/:id",
      zodValidate(CheckInParamsSchema, "params"),
      permissionMiddleware("checkIn", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
