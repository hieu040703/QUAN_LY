import { inject, injectable } from "inversify";
import { EntityManager } from "typeorm";
import { RefType, Transaction, TransactionTypeEnum } from "@/database/models/Transaction";
import { IFindPaginationOptions } from "@/shared/base/BaseRepository";
import { BaseService, IFindOptions } from "@/shared/base/BaseService";
import { TransactionRepository } from "./transaction.repository";
import { TRANSACTION_TYPES } from "./transaction.types";
import { UserPacket } from "@/database/models/UserPacket";
import { CheckIn } from "@/database/models/CheckIn";

@injectable()
export class TransactionService extends BaseService<Transaction> {
  protected repository: TransactionRepository;

  constructor(
    @inject(TRANSACTION_TYPES.TransactionRepository)
    repository: TransactionRepository,
  ) {
    super();
    this.repository = repository;
  }

  async createTransactionAddPackage(data: UserPacket, manager?: EntityManager) {
    const dataCreate: Partial<Transaction> = {
      type: TransactionTypeEnum.IN,
      clubId: data.clubId,
      userId: data.userId,
      packetId: data.packetId,
      refId: data.id,
      refType: RefType.PACKAGE,
      timeAt: data.startTime,
      quantity: data.quota,
      amount: data.packet?.amount ?? 0,
    };

    await this.repository.create(dataCreate, manager);
  }

  async createTransactionCheckIn(data: Partial<CheckIn>, manager?: EntityManager) {
    const dataCreate: Partial<Transaction> = {
      type: TransactionTypeEnum.OUT,
      clubId: data.userPacket?.clubId,
      userId: data.userId,
      packetId: data.userPacket?.packetId,
      refId: data.id!,
      refType: RefType.CHECK_IN,
      timeAt: data.createdAt,
      quantity: data.quantity,
      amount: data.amount ?? 0,
      usedClubId: data.clubId,
    };

    await this.repository.create(dataCreate, manager);
  }

  async deleteTransactionPackage(data: UserPacket, manager?: EntityManager) {
    const dataCreate: Partial<Transaction> = {
      type: TransactionTypeEnum.OUT,
      clubId: data.clubId,
      userId: data.userId,
      packetId: data.packetId,
      refId: data.id,
      refType: RefType.PACKAGE,
      timeAt: data.startTime,
      quantity: data.remainingQuantity,
      amount: data.packet?.amount ?? 0,
    };

    await this.repository.create(dataCreate, manager);
  }
}
