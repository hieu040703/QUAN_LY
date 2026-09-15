import { BaseQuerySchema } from "@/shared/base/BaseValidator";
import { z } from "zod";

export const TransactionHistoryQuerySchema = BaseQuerySchema.omit({ userId: true });

export type TransactionHistoryQueryDto = z.infer<typeof TransactionHistoryQuerySchema>;