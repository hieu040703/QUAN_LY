import { Router } from "express";
import { injectable, inject } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateRoleSchema,
  UpdateRoleSchema,
  RoleQuerySchema,
  RoleParamsSchema,
} from "./role.validator";
import { RoleController } from "./role.controller";
import { ROLE_TYPES } from "./role.types";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";

@injectable()
export class RoleRouter {
  private router: Router;

  constructor(
    @inject(ROLE_TYPES.RoleController)
    private roleController: RoleController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All role routes require authentication
    // this.router.use(authenticate);

    // GET /roles - Get all roles with filters
    this.router.get(
      "/",
      zodValidate(RoleQuerySchema, "query"),
      permissionMiddleware("permission", "read"),
      this.roleController.getAllWithPagination,
    );

    // POST /roles - Create new role
    this.router.post(
      "/",
      zodValidate(CreateRoleSchema, "body"),
      permissionMiddleware("permission", "create"),
      this.roleController.create,
    );

    // GET /roles/:id - Get role by ID
    this.router.get(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      permissionMiddleware("permission", "read"),
      this.roleController.getById,
    );

    // PUT /roles/:id - Update role
    this.router.put(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      zodValidate(UpdateRoleSchema, "body"),
      permissionMiddleware("permission", "update"),
      this.roleController.update,
    );

    // DELETE /roles/:id - Delete role
    this.router.delete(
      "/:id",
      zodValidate(RoleParamsSchema, "params"),
      permissionMiddleware("permission", "delete"),
      this.roleController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
