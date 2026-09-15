import { Transaction } from "@/database/models/Transaction";
import { BaseRepository, IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { SelectQueryBuilder } from "typeorm";
import { TransactionRelations, TransactionSelectFull } from "./transaction.select";

export class TransactionRepository extends BaseRepository<Transaction> {
  protected entityClass = Transaction;
  protected selectedFields = TransactionSelectFull;
  protected relations = TransactionRelations;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Transaction>,
    options: IFindPaginationOptions<Transaction>,
  ): Promise<void> {
    await super.extendQueryBuilder(qb, options);

    const userId = (options.moreQuery as { userId?: string } | undefined)?.userId;
    if (userId) {
      qb.andWhere("entity.userId = :transactionUserId", { transactionUserId: userId });
    }
  }
}
