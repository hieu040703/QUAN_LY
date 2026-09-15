import { Router } from "express";
import { injectable, inject } from "inversify";
import { AttributeController } from "./attribute.controller";
import { zodValidate } from "@/shared/middleware/validation.middleware";

import {
  CreateAttributeSchema,
  UpdateAttributeSchema,
  AttributeQuerySchema,
  AttributeParamsSchema,
} from "./attribute.validator";
import { ATTRIBUTE_TYPES } from "./attribute.types";

@injectable()
export class AttributeRouter {
  private router: Router;

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeController)
    private attributeController: AttributeController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // All attribute routes require tenant context (tenant already resolved by client.routes)
    // GET /attributes - Get all attributes with filters
    this.router.get(
      "/",
      zodValidate(AttributeQuerySchema, "query"),
      this.attributeController.getByType,
    );

    // POST /attributes - Create new attribute
    this.router.post(
      "/",
      zodValidate(CreateAttributeSchema, "body"),
      this.attributeController.create,
    );

    // GET /attributes/:id - Get attribute by ID
    this.router.get(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      this.attributeController.getById,
    );

    // PUT /attributes/:id - Update attribute
    this.router.put(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      zodValidate(UpdateAttributeSchema, "body"),
      this.attributeController.update,
    );

    // DELETE /attributes/:id - Delete attribute
    this.router.delete(
      "/:id",
      zodValidate(AttributeParamsSchema, "params"),
      this.attributeController.delete,
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
