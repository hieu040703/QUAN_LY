import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { RoleRepository } from "./role.repository";
import { ROLE_TYPES } from "./role.types";
import { Role } from "@/database/models/Role";

@injectable()
export class RoleService extends BaseService<Role> {
  protected repository: RoleRepository;
  protected uniqueFields?: (keyof Role)[] | undefined = ["name"];
  protected searchableFields = ["name"];

  constructor(
    @inject(ROLE_TYPES.RoleRepository)
    repository: RoleRepository,
  ) {
    super();
    this.repository = repository;
  }
}
