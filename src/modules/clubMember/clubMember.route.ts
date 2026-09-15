import { Router } from "express";
import { inject, injectable } from "inversify";
import { permissionMiddleware } from "@/shared/middleware/permission.middleware";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { ClubMemberController } from "./clubMember.controller";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";
import {
  ClubMemberParamsSchema,
  ClubMemberQuerySchema,
  CreateClubMemberSchema,
  UpdateClubMemberSchema,
  UpdateMemberStatusSchema,
} from "./clubMember.validator";

@injectable()
export class ClubMemberRouter {
  private router: Router;

  constructor(
    @inject(CLUB_MEMBER_TYPES.ClubMemberController)
    private controller: ClubMemberController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      zodValidate(ClubMemberQuerySchema, "query"),
      permissionMiddleware("clubMember", "read"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/:id/approve",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "approve"),
      this.controller.approve,
    );
    this.router.post(
      "/:id/kick",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "kick"),
      this.controller.kick,
    );
    this.router.post(
      "/:id/block",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "block"),
      this.controller.block,
    );
    this.router.post(
      "/:id/un-lock",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "block"),
      this.controller.unLock,
    );
    this.router.post(
      "/",
      zodValidate(CreateClubMemberSchema, "body"),
      permissionMiddleware("clubMember", "create"),
      this.controller.create,
    );
    this.router.put(
      "/:id",
      zodValidate(ClubMemberParamsSchema, "params"),
      zodValidate(UpdateClubMemberSchema, "body"),
      permissionMiddleware("clubMember", "update"),
      this.controller.update,
    );
    this.router.get(
      "/:id",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "read"),
      this.controller.getById,
    );
    this.router.delete(
      "/:id",
      zodValidate(ClubMemberParamsSchema, "params"),
      permissionMiddleware("clubMember", "delete"),
      this.controller.delete,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
