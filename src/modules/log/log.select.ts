import { OperationLog } from "@/database/models/OperationLog";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const LogSelectBasic: FindOptionsSelect<OperationLog> = {
  ...BaseSelect,
  action: true,
  targetEntity: true,
  targetId: true,
  requestBody: true,
  targetSnapshot: true,
  changes: true,
  actorId: true,
  actorSnapshot: true,
  requestId: true,
  method: true,
  endpoint: true,
  ipAddress: true,
  userAgent: true,
  success: true,
  error: true,
  metadata: true,
};

export const LogSelectFull: FindOptionsSelect<OperationLog> = {
  ...LogSelectBasic,
  actor: true,
};

export const LogRelations: FindOptionsRelations<OperationLog> = {
  actor: true,
};
