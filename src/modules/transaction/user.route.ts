import { Router } from "express";
import { inject, injectable } from "inversify";
import { zodValidate } from "@/shared/middleware/validation.middleware";
import { TransactionController } from "./transaction.controller";
import { TRANSACTION_TYPES } from "./transaction.types";
import { TransactionHistoryQuerySchema } from "./transaction.validator";

@injectable()
export class UserTransactionRouter {
  private router: Router;

  constructor(
    @inject(TRANSACTION_TYPES.TransactionController)
    private controller: TransactionController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", zodValidate(TransactionHistoryQuerySchema, "query"), this.controller.getHistory);
  }

  getRouter(): Router {
    return this.router;
  }
}
