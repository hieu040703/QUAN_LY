import { NextFunction, Request, Response } from "express";
import {
  OperationAction,
  OperationLogUtils,
} from "@/shared/utils/operationLog.utils";

function resolveActionByMethod(method: string): OperationAction {
  const upperMethod = method.toUpperCase();
  if (upperMethod === "POST") return "create";
  if (upperMethod === "PUT" || upperMethod === "PATCH") return "update";
  if (upperMethod === "DELETE") return "delete";
  return "custom";
}

function resolveTargetEntity(pathname: string): string {
  const segments = pathname
    .split("?")[0]
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!segments.length) return "action";

  if (segments[0] === "v1") {
    if (segments.length >= 3) return segments[2];
    if (segments.length >= 2) return segments[1];
  }

  return segments[0] || "action";
}

function shouldLogRequest(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return false;
  }

  return req.originalUrl.startsWith("/v1/");
}

export function operationLogActionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!shouldLogRequest(req)) {
    next();
    return;
  }

  let responsePayload: unknown = null;
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    responsePayload = body;
    return originalJson(body);
  }) as Response["json"];

  res.on("finish", () => {
    if ((req as any).__operationLogHandled) {
      return;
    }

    const payloadAsRecord =
      responsePayload && typeof responsePayload === "object"
        ? (responsePayload as Record<string, unknown>)
        : null;

    const statusCode = res.statusCode;
    const success = statusCode >= 200 && statusCode < 400;

    void OperationLogUtils.writeOperationLog({
      req,
      action: resolveActionByMethod(req.method),
      targetEntity: resolveTargetEntity(req.originalUrl),
      requestBody: OperationLogUtils.toOperationRecord(req.body),
      success,
      error: success
        ? null
        : {
            message:
              (payloadAsRecord?.message as string) ||
              `Request failed with status ${statusCode}`,
            statusCode,
            errors: payloadAsRecord?.errors || null,
          },
      metadata: {
        source: "action-middleware",
        statusCode,
      },
    });
  });

  next();
}
