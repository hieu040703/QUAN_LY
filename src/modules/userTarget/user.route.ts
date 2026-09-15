import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { UserTargetController } from "./userTarget.controller";
import { USER_TARGET_TYPES } from "./userTarget.types";
import {
  CreateUserTargetSchema,
  UpdateUserTargetSchema,
  UserTargetParamsSchema,
  UserTargetQuerySchema,
} from "./userTarget.validator";

@injectable()
export class UserUserTargetRouter {
  private router: Router;

  constructor(
    @inject(USER_TARGET_TYPES.UserTargetController)
    private controller: UserTargetController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(UserTargetQuerySchema, "query"), this.controller.getAllWithPagination);
    this.router.post("/", zodValidate(CreateUserTargetSchema, "body"), this.controller.create);
    this.router.put(
      "/:id",
      zodValidate(UserTargetParamsSchema, "params"),
      zodValidate(UpdateUserTargetSchema, "body"),
      this.controller.update,
    );
    this.router.delete("/:id", zodValidate(UserTargetParamsSchema, "params"), this.controller.delete);
  }

  getRouter(): Router {
    return this.router;
  }
}
