import { inject, injectable } from "inversify";
import { ClubRole } from "@/database/models/ClubRole";
import { BaseService } from "@/shared/base/BaseService";
import { ClubRoleRepository } from "./clubRole.repository";
import { CLUB_ROLE_TYPES } from "./clubRole.types";

@injectable()
export class ClubRoleService extends BaseService<ClubRole> {
  protected repository: ClubRoleRepository;
  protected uniqueFields?: (keyof ClubRole)[] | undefined = ["name"];
  protected uniqueScope?: (keyof ClubRole)[] | undefined = ["clubId"];
  protected searchableFields = ["name"];

  constructor(
    @inject(CLUB_ROLE_TYPES.ClubRoleRepository)
    repository: ClubRoleRepository,
  ) {
    super();
    this.repository = repository;
  }
}
