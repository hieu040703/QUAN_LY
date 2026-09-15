import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { attachUserIdFromAuth } from "@/shared/middleware/userId.middleware";
import { ClubMemberController } from "./clubMember.controller";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";
import { ClubMemberParamsSchema, ClubMemberQuerySchema, CreateClubMemberSchema } from "./clubMember.validator";

@injectable()
export class UserClubMemberRouter {
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
      attachUserIdFromAuth("clubMember", "read", "query", { attachUserIdWhenHasPermission: false }),
      this.controller.getAllWithPagination,
    );
    this.router.put("/:id/kick", zodValidate(ClubMemberParamsSchema, "params"), this.controller.kick);
    this.router.post("/", zodValidate(CreateClubMemberSchema, "body"), this.controller.create);
  }

  getRouter(): Router {
    return this.router;
  }
}
