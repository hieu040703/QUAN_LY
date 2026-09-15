import { ContainerModule } from "inversify";
import { TransactionRepository } from "./transaction.repository";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { TransactionRouter } from "./transaction.route";
import { UserTransactionRouter } from "./user.route";
import { TRANSACTION_TYPES } from "./transaction.types";

export const transactionModule = new ContainerModule((bind) => {
  bind<TransactionRepository>(TRANSACTION_TYPES.TransactionRepository).to(TransactionRepository);
  bind<TransactionService>(TRANSACTION_TYPES.TransactionService).to(TransactionService);
  bind<TransactionController>(TRANSACTION_TYPES.TransactionController).to(TransactionController);
  bind<TransactionRouter>(TRANSACTION_TYPES.TransactionRouter).to(TransactionRouter);
  bind<UserTransactionRouter>(TRANSACTION_TYPES.UserTransactionRouter).to(UserTransactionRouter);
});
