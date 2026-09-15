import { zodValidate } from "@/shared/middleware/validation.middleware";
import { Router } from "express";
import { inject, injectable } from "inversify";
import { CreateUserSchema, UpdateUserSchema, UserParamsSchema, UserQuerySchema } from "./user.validator";
import { USER_TYPES } from "./user.types";
import { UserController } from "./user.controller";
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
      permissionMiddleware("user", "read"),
      this.userController.findByCode,
    );

    this.router.get(
      "/",
      zodValidate(UserQuerySchema, "query"),
      permissionMiddleware("user", "read"),
      this.userController.getAllWithPagination,
    );

    // POST /roles - Create new role
    this.router.post(
      "/",
      zodValidate(CreateUserSchema, "body"),
      permissionMiddleware("user", "create"),
      this.userController.create,
    );

    // GET /roles/:id - Get role by ID
    this.router.get(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      permissionMiddleware("user", "read"),
      this.userController.getById,
    );

    // PUT /roles/:id - Update role
    this.router.put(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      zodValidate(UpdateUserSchema, "body"),
      permissionMiddleware("user", "update"),
      this.userController.update,
    );

    // DELETE /roles/:id - Delete role
    this.router.delete(
      "/:id",
      zodValidate(UserParamsSchema, "params"),
      permissionMiddleware("user", "delete"),
      this.userController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
