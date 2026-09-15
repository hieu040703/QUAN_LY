import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachClubIsMiddleware, clubPermissionMiddleware } from "@/shared/middleware/clubPermission.middleware";
import { ClubMemberController } from "./clubMember.controller";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";
import {
  ClubMemberParamsSchema,
  ClubMemberQuerySchema,
  CreateClubMemberSchema,
  UpdateClubMemberSchema,
} from "./clubMember.validator";

@injectable()
export class ManagerClubMemberRouter {
  private readonly router: Router;

  constructor(@inject(CLUB_MEMBER_TYPES.ClubMemberController) private readonly controller: ClubMemberController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/",
      attachClubIsMiddleware("clubMember", "read"),
      zodValidate(ClubMemberQuerySchema, "query"),
      this.controller.getAllWithPagination,
    );
    this.router.post(
      "/:id/approve",
      clubPermissionMiddleware("clubMember", "approve", { verifyResourceClub: true }),
      zodValidate(ClubMemberParamsSchema, "params"),
      this.controller.approve,
    );
    this.router.post(
      "/:id/kick",
      clubPermissionMiddleware("clubMember", "kick", { verifyResourceClub: true }),
      zodValidate(ClubMemberParamsSchema, "params"),
      this.controller.kick,
    );
    this.router.post(
      "/:id/block",
      clubPermissionMiddleware("clubMember", "block", { verifyResourceClub: true }),
      zodValidate(ClubMemberParamsSchema, "params"),
      this.controller.block,
    );
    this.router.post(
      "/:id/un-lock",
      zodValidate(ClubMemberParamsSchema, "params"),
      clubPermissionMiddleware("clubMember", "block"),
      this.controller.unLock,
    );
    this.router.post(
      "/",
      clubPermissionMiddleware("clubMember", "create"),
      zodValidate(CreateClubMemberSchema, "body"),
      this.controller.create,
    );
    this.router.get(
      "/:id",
      clubPermissionMiddleware("clubMember", "read", { verifyResourceClub: true }),
      zodValidate(ClubMemberParamsSchema, "params"),
      this.controller.getById,
    );
    this.router.put(
      "/:id",
      zodValidate(ClubMemberParamsSchema, "params"),
      zodValidate(UpdateClubMemberSchema, "body"),
      clubPermissionMiddleware("clubMember", "update", { verifyResourceClub: true }),
      this.controller.update,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
