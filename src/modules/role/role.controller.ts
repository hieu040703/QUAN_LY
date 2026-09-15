import { injectable, inject } from "inversify";
import { RoleService } from "./role.service";
import { BaseController } from "@/shared/base/BaseController";
import { ROLE_TYPES } from "./role.types";
import { Role } from "@/database/models/Role";

@injectable()
export class RoleController extends BaseController<Role> {
  protected service: RoleService;

  constructor(
    @inject(ROLE_TYPES.RoleService)
    roleService: RoleService,
  ) {
    super();
    this.service = roleService;
  }

  protected getEntityName(): string {
    return "permission";
  }
}
