import { UserSnapshot } from "@/shared/base/BaseEntity";
import { Request, Response } from "express";
import { FindManyOptions } from "typeorm";

export type CompareOperator = ">=" | ">" | "<=" | "<" | "=";
export const rangeSuffixes = ["Gte", "Gt", "Eq", "Lte", "Lt"];
export type RangeSuffix = (typeof rangeSuffixes)[number];
export const OPERATOR_MAP: Record<RangeSuffix, CompareOperator> = {
  Gte: ">=",
  Gt: ">",
  Lte: "<=",
  Lt: "<",
  Eq: "=",
};

export interface UserContext {
  userId: string;
  userSnapshot: UserSnapshot;
  customerId?: string;
  employeeId?: string;
  technicianId?: string;
}

export interface BranchContext {
  branchId: string;
  branchName: string;
  branchCode: string;
  isHeadquarters: boolean;
}

export type PartnerDebtModule = "payableDebtReport" | "receivableDebtReport";

export interface PartnerDebtCtx {
  module: PartnerDebtModule;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface Pagination {
  totalRecords: number;
  currentPage: number;
  size: number;
  totalPages: number;
}

export interface SendResponseParams {
  res: Response;
  data?: any;
  message?: string;
  statusCode?: number;
}

export interface SendErrorParams {
  res: Response;
  message?: string;
  statusCode?: number;
  errors?: IError[];
}

export type SummaryKey =
  | "openingQty"
  | "openingAmount"
  | "increaseQty"
  | "increaseAmount"
  | "decreaseQty"
  | "decreaseAmount"
  | "closingQty"
  | "closingAmount"
  | "outOfStockItems"
  | "lowStockItems"
  | "overstockItems"
  // TODO: totalKey
  | "totalRevenue"
  | "totalExpense"
  | "totalIncome"
  | "totalCost"
  | "totalProfit"
  | "totalDebt"
  | "totalReceivableDebt"
  | "totalPayableDebt"
  | "totalIncreaseAmount"
  | "totalDecreaseAmount"
  | "recordsWithoutInvoiceCount";

export type SummaryData = {
  [key: string]: number | undefined;
};
export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
  errors?: any;
  code?: string;
  summary?: SummaryData; // Optional error code for more specific error handling
}

export type ExcelExportType =
  | "ORDER"
  | "STORE_TO_LEADER"
  | "LEADER_TO_STORE"
  | "LEADER_TO_WORKER"
  | "WORKER_TO_LEADER"
  | "TAG_OF_CONSIGNMENT"
  | "TAG_OF_ORDER"
  | "TAG_OF_LEADER_TO_WORKER"
  | "LEADER_TO_STORE_ORDER"
  | "LEADER_TO_STORE_IN_ORDER"
  | "DAO_RUT_TO_STORE"
  | "DAO_RUT_TO_WORKER"
  | "WORKER_TO_DAO_RUT";
export type ExcelImportType = "SELL" | "PURCHASE" | "ADJUST_INVENTORY";
export type ExcelTemplateType = "SELL" | "PURCHASE" | "ADJUST_INVENTORY";

export interface PriceUpdate {
  id: string;
  product: string;
  price: number;
  currency: string;
  timestamp: number;
}

export interface SSEClient {
  id: string;
  response: any;
  userId?: string;
  connectedAt: number;
}

export interface ImportExcelResult {
  statusCode?: number;
  message?: string;
  resultFile: string;
  total: number;
  success: number;
  failed: number;
}

export interface ISocketResponse {
  statusCode: number;
  message: string;
  resultFile?: string;
  total?: number;
  success?: number;
  failed?: number;
  duration?: string;
  data?: any;
}

export interface FilterItem {
  id: string;
  name: string;
  type: string;
  value: number;
  /** Parent category id — dùng khi filter item có cấp cha/con (bỏ qua khi tính tổng) */
  parentId?: string | null;
}

export interface RangerFilter {
  field: string;
  eq?: number;
  gte?: number;
  gt?: number;
  lte?: number;
  lt?: number;
}

export type ActionKey =
  | "update"
  | "delete"
  | "assign"
  | "unassign"
  | "confirm"
  | "cancelConfirm"
  | "cancel"
  | "approve"
  | "reject"
  | "submit"
  | "complete"
  | "archive"
  | "restore"
  | "updateMode"
  | "start"
  | "arrive"
  | "beginWork"
  | "accept"
  | "sendMessage"
  | "pay"
  | "export"
  | "import"
  | "remind";

export type ActionValue = {
  can: boolean;
  reason?: string;
};
export type ActionMap = Partial<Record<ActionKey, ActionValue>>;

export interface BranchContext {
  branchId: string;
  isHeadquarters: boolean;
}

export interface RequestContext extends Pick<Request, "userContext" | "permissions" | "query"> {
  /** machineId hạn chế khi QR machine login (restrictMachineLogin middleware) */
  restrictedMachineId?: string;
}

export interface AuthenticatedRequest extends Request {
  userContext?: UserContext;
  branchContext?: BranchContext;
}

export interface PaginationMeta {
  totalRecords: number;
  size: number;
  currentPage: number;
  totalPages: number;
}

export interface IError {
  field?: string;
  code: string;
  message?: string;
}

export interface SendErrorParams {
  res: import("express").Response;
  message?: string;
  statusCode?: number;
  errors?: IError[];
}

export type ISummaryCountCase<T> = {
  key: string;
  field: keyof T | string;
  value: string | number | boolean | null;
};

export type ISummaryCountMap<T> = Partial<Record<Extract<keyof T, string>, (string | number | boolean | null)[]>>;

export type ISummarySumCase<T> = {
  key: string;
  sumField: keyof T | string;
  filterField: keyof T | string;
  filterValue: string | number | boolean | null;
};
