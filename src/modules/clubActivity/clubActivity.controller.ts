import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { ClubActivity } from "@/database/models/ClubActivity";
import { ClubActivityService } from "./clubActivity.service";
import { CLUB_ACTIVITY_TYPES } from "./clubActivity.types";

@injectable()
export class ClubActivityController extends BaseController<ClubActivity> {
  protected service: ClubActivityService;

  constructor(
    @inject(CLUB_ACTIVITY_TYPES.ClubActivityService)
    service: ClubActivityService,
  ) {
    super();
    this.service = service;
  }
}
