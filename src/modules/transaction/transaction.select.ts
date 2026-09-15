import { Transaction } from "@/database/models/Transaction";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const TransactionSelectBasic: FindOptionsSelect<Transaction> = {
  ...BaseSelect,
  userId: true,
  clubId: true,
  packetId: true,
  usedClubId: true,
  refId: true,
  quantity: true,
  amount: true,
  type: true,
  refType: true,
  timeAt: true,
};

export const TransactionSelectFull: FindOptionsSelect<Transaction> = {
  ...TransactionSelectBasic,
};

export const TransactionRelations: FindOptionsRelations<Transaction> = {};
