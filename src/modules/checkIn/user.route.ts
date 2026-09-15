import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { CheckInController } from "./checkIn.controller";
import { CHECK_IN_TYPES } from "./checkIn.types";
import { CheckInQuerySchema, CreateUserCheckInSchema } from "./checkIn.validator";

@injectable()
export class UserCheckInRouter {
  private router: Router;

  constructor(
    @inject(CHECK_IN_TYPES.CheckInController)
    private controller: CheckInController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(CheckInQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.post("/", zodValidate(CreateUserCheckInSchema, "body"), this.controller.create);
  }

  getRouter(): Router {
    return this.router;
  }
}
