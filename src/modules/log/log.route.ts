import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { LOG_TYPES } from "./log.types";
import { LogController } from "./log.controller";
import { LogParamsSchema, LogQuerySchema } from "./log.validator";

@injectable()
export class LogRouter {
  private router: Router;

  constructor(
    @inject(LOG_TYPES.LogController)
    private controller: LogController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(LogQuerySchema, "query"),
      permissionMiddleware("log", "read"),
      this.controller.getAllWithPagination,
    );

    this.router.get(
      "/:id",
      zodValidate(LogParamsSchema, "params"),
      permissionMiddleware("log", "read"),
      this.controller.getById,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
