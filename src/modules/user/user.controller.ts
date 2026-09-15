import { injectable, inject } from "inversify";
import { UserService } from "./user.service";
import { BaseController } from "@/shared/base/BaseController";
import { USER_TYPES } from "./user.types";
import { User } from "@/database/models/User";
import { asyncHandler } from "@/shared/utils/controller.utils";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "@/shared/types/errors";

@injectable()
export class UserController extends BaseController<User> {
  protected service: UserService;
  constructor(@inject(USER_TYPES.UserService) service: UserService) {
    super();
    this.service = service;
  }

  findByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.query;
      if (!code) throw new BadRequestError("Mã hội viên không hợp lệ!");
      const result = await this.service.findByCode(code as string);
      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };
}
