import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import { CreateUserSchema, UserParamsSchema, UserQuerySchema } from "./user.validator";
import { USER_TYPES } from "./user.types";
import { UserController } from "./user.controller";
import { clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class UserRouter {
  private router: Router;

  constructor(
    @inject(USER_TYPES.UserController)
    private userController: UserController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /roles - Get all roles with filters
    this.router.get(
      "/code",
      zodValidate(UserQuerySchema, "query"),
      clubPermissionMiddleware("checkIn", "create"),
      this.userController.findByCode,
    );

    this.router.get(
      "/",
      zodValidate(UserQuerySchema, "query"),
      clubPermissionMiddleware("user", "read"),
      this.userController.getAllWithPagination,
    );

    this.router.get("/:id", zodValidate(UserParamsSchema, "params"), this.userController.getById);

    this.router.post(
      "/",
      zodValidate(CreateUserSchema, "body"),
      clubPermissionMiddleware("clubMember", "create"),
      this.userController.create,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
