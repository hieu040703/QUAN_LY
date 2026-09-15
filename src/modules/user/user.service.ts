import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { UserRepository } from "./user.repository";
import { USER_TYPES } from "./user.types";
import { User } from "@/database/models/User";
import { DeepPartial, EntityManager } from "typeorm";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { Request } from "express";
import { ApiResponseHandler } from "@/shared/utils/response.utils";

@injectable()
export class UserService extends BaseService<User> {
  protected repository: UserRepository;
  protected uniqueFields?: (keyof User)[] = ["phone", "email", "username"];
  protected searchableFields = ["phone", "name", "email", "address.state", "address.ward"];

  constructor(
    @inject(USER_TYPES.UserRepository)
    repository: UserRepository,
  ) {
    super();
    this.repository = repository;
  }

  async validateBeforeCreate(data: DeepPartial<User>, manager: EntityManager, req?: Request): Promise<void> {
    if (data.password) {
      data.password = await AuthUtils.hashPassword(data.password);
    }
  }

  async findByCode(code: string) {
    const user = await this.repository.findOne({ where: { code } });
    return ApiResponseHandler.getSuccess("OK", user);
  }
}
