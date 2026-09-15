import { Request } from "express";
import DatabaseConfig from "@/config/database";
import { OperationLog, OperationChangeItem, OperationErrorItem } from "@/database/models/OperationLog";
import logger from "./logger";
import { UserSnapshot } from "@/shared/base/BaseEntity";

export type OperationAction = "create" | "update" | "delete" | (string & {});

export interface WriteOperationLogParams {
  req?: Request;
  action: OperationAction;
  targetEntity: string;
  targetId?: string | null;
  requestBody?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  success?: boolean;
  error?: unknown;
  metadata?: Record<string, unknown> | null;
  markRequestLogged?: boolean;
}

export interface FinalizeOperationLogParams {
  logId?: string | null;
  targetId?: string | null;
  requestBody?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  success: boolean;
  error?: unknown;
  metadata?: Record<string, unknown> | null;
  creatorId?: string | null;
  creator?: UserSnapshot | null;
}

const REQUEST_LOGGED_KEY = "__operation_logged__";

export class OperationLogUtils {
  static markRequestLogged(req: Request): void {
    (req as any)[REQUEST_LOGGED_KEY] = true;
  }

  static isRequestLogged(req: Request): boolean {
    return !!(req as any)[REQUEST_LOGGED_KEY];
  }

  static async createOperationLog(params: WriteOperationLogParams): Promise<string | null> {
    try {
      if (!DatabaseConfig.isInitialized) return null;

      const repo = DatabaseConfig.getRepository(OperationLog);

      const userContext = (params.req as any)?.userContext || null;
      const creator = userContext?.userSnapshot || null;

      const before = this.toOperationRecord(params.before);
      const after = this.toOperationRecord(params.after);
      const changes = this.computeChanges(before, after);
      const endpoint = this.resolveEndpoint(params.req);

      const payload = repo.create({
        action: params.action,
        targetEntity: params.targetEntity,
        targetId: params.targetId || null,
        requestBody: this.toOperationRecord(params.requestBody),
        targetSnapshot: after || before || null,
        changes,
        creatorId: userContext?.userId || null,
        creator,
        requestId: (params.req?.headers["x-request-id"] as string) || null,
        method: params.req?.method || null,
        endpoint,
        ipAddress: params.req?.ip || null,
        userAgent: params.req?.headers["user-agent"] || null,
        success: params.success ?? false,
        error: this.serializeOperationError(params.error),
        metadata: this.toOperationRecord(params.metadata),
      });

      const saved = await repo.save(payload);

      if (params.req && params.markRequestLogged) {
        this.markRequestLogged(params.req);
      }

      return saved.id;
    } catch (error) {
      logger.error("[OperationLog] Failed to create operation log", error);
      return null;
    }
  }

  static async finalizeOperationLog(params: FinalizeOperationLogParams): Promise<void> {
    try {
      if (!DatabaseConfig.isInitialized || !params.logId) return;

      const repo = DatabaseConfig.getRepository(OperationLog);
      const log = await repo.findOne({ where: { id: params.logId as any } });
      if (!log) return;

      log.success = params.success;

      if (params.targetId !== undefined) {
        log.targetId = params.targetId || null;
      }

      if (params.requestBody !== undefined) {
        log.requestBody = this.toOperationRecord(params.requestBody);
      }

      if (params.before !== undefined || params.after !== undefined) {
        const before = this.toOperationRecord(params.before);
        const after = this.toOperationRecord(params.after);
        log.targetSnapshot = after || before || null;
        log.changes = this.computeChanges(before, after);
      }

      if (params.metadata !== undefined) {
        log.metadata = this.toOperationRecord(params.metadata);
      }

      log.error = this.serializeOperationError(params.error);
      log.creatorId = params.creatorId || log.creatorId;
      log.creator = params.creator || log.creator;

      await repo.save(log);
    } catch (error) {
      logger.error("[OperationLog] Failed to finalize operation log", error);
    }
  }

  static async writeOperationLog(params: WriteOperationLogParams): Promise<void> {
    await this.createOperationLog({ ...params, success: params.success ?? true });
  }

  static toOperationRecord(value: unknown): Record<string, unknown> | null {
    if (!this.isObjectLike(value)) return null;
    try {
      return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  static enrichRequestBodyWithRelations(
    requestBody: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!requestBody) return after;
    if (!after) return requestBody;

    const keysToCheck = ["customer", "machine", "user", "technician", "branch", "territory"];
    const enriched = { ...requestBody };

    for (const key of keysToCheck) {
      if (requestBody[key] && typeof requestBody[key] === "string" && after[key] && typeof after[key] === "object") {
        enriched[key] = after[key];
      }
    }

    return enriched;
  }

  private static computeChanges(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): OperationChangeItem[] | null {
    if (!before || !after) return null;

    const changes: OperationChangeItem[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (key === "updatedAt" || key === "createdAt" || key === "deletedAt") continue;

      const beforeVal = before[key];
      const afterVal = after[key];

      if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
        changes.push({ path: key, before: beforeVal, after: afterVal });
      }
    }

    return changes.length > 0 ? changes : null;
  }

  private static serializeOperationError(error: unknown): OperationErrorItem | null {
    if (!error) return null;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    }

    if (typeof error === "object") {
      const e = error as Record<string, unknown>;
      return {
        name: (e.name as string) || "Error",
        message: (e.message as string) || String(error),
        statusCode: e.statusCode as number,
        code: e.code as string | number,
        errors: e.errors,
      };
    }

    return { message: String(error) };
  }

  private static resolveEndpoint(req?: Request): string | null {
    if (!req) return null;
    return `${req.method} ${req.originalUrl || req.url}`;
  }

  private static isObjectLike(value: unknown): boolean {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
}
