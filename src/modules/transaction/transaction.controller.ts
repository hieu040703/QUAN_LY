import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IFindOptions } from "@/shared/base/BaseService";
import { UnauthorizedError } from "@/shared/types/errors";
import { Transaction } from "@/database/models/Transaction";
import { TransactionService } from "./transaction.service";
import { TRANSACTION_TYPES } from "./transaction.types";
import { BaseController } from "@/shared/base/BaseController";

@injectable()
export class TransactionController extends BaseController<Transaction> {
  protected service: TransactionService;

  constructor(
    @inject(TRANSACTION_TYPES.TransactionService)
    service: TransactionService,
  ) {
    super();
    this.service = service;
  }

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userContext?.userId ?? req.user?.userId;
      if (!userId) throw new UnauthorizedError("User not authenticated");

      const options = req.query as unknown as IFindOptions<Transaction> & { userId: string };
      options.userId = userId;

      const result = await this.service.findAllWithPagination(options);

      return res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  };
}
