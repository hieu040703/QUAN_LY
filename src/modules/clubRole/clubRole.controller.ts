import { inject, injectable } from "inversify";
import { ClubRole } from "@/database/models/ClubRole";
import { BaseController } from "@/shared/base/BaseController";
import { ClubRoleService } from "./clubRole.service";
import { CLUB_ROLE_TYPES } from "./clubRole.types";

@injectable()
export class ClubRoleController extends BaseController<ClubRole> {
  protected service: ClubRoleService;

  constructor(
    @inject(CLUB_ROLE_TYPES.ClubRoleService)
    service: ClubRoleService,
  ) {
    super();
    this.service = service;
  }
}
