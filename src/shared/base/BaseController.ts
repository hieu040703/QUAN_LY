import { Request, Response, NextFunction } from "express";
import { BaseService, IFindOptions } from "./BaseService";
import { SendErrorParams, SendResponseParams } from "@/shared/types/interfaces";
import { OperationLogUtils } from "@/shared/utils/operationLog.utils";
import { BaseEntity } from "./BaseEntity";

export abstract class BaseController<T extends BaseEntity> {
  protected abstract service: BaseService<T>;

  protected getEntityName(): string {
    const constructorName =
      (this.service as any)?.repository?.constructor?.name || "entity";
    return constructorName
      .replace(/Repository$/, "")
      .replace(/^(\w)/, (m: string) => m.toLowerCase());
  }

  protected sendResponse({
    res,
    data = null,
    message = "Success",
    statusCode = 200,
  }: SendResponseParams): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected sendError({
    res,
    message = "Error",
    statusCode = 500,
    errors = [],
  }: SendErrorParams): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================================
  // CRUD Handlers
  // ============================================================

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const options = req.query as unknown as IFindOptions<T>;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        reqContext,
      );
      await this.service.hydrateEntities(data.data, reqContext);
      return res.status(data.statusCode).json(data);
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findAll();
      const reqContext = this.service.getReqContext(req);
      await this.service.hydrateEntities(data, reqContext);
      return res.status(200).json({
        success: true,
        data,
        statusCode: 200,
        message: "Fetched successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.findById(id, undefined, reqContext);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: [{ field: "id", code: "NOT_FOUND" }],
        });
      }

      await this.service.hydrateEntity(data, reqContext);
      return res.json({
        success: true,
        data,
        message: "Fetched successfully",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    const requestBody = OperationLogUtils.toOperationRecord(req.body);
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "create",
      targetEntity: this.getEntityName(),
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.create(req.body, undefined, reqContext);
      const after = OperationLogUtils.toOperationRecord(data);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: (data as any)?.id || null,
          requestBody: OperationLogUtils.enrichRequestBodyWithRelations(
            requestBody,
            after,
          ),
          after,
        });
      }

      await this.service.hydrateEntity(data, reqContext);
      return res.status(201).json({
        success: true,
        data,
        message: "Created successfully",
        statusCode: 201,
      });
    } catch (error) {
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          requestBody,
          error,
        });
      }
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const requestBody = OperationLogUtils.toOperationRecord(req.body);
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "update",
      targetEntity: this.getEntityName(),
      targetId: id,
      requestBody,
      success: false,
      markRequestLogged: true,
    });

    try {
      const reqContext = this.service.getReqContext(req);
      const before = await this.service.findById(id, undefined, reqContext);
      const data = await this.service.update(
        id,
        req.body,
        undefined,
        reqContext,
      );

      if (logId) {
        const beforeRecord = OperationLogUtils.toOperationRecord(before);
        const afterRecord = OperationLogUtils.toOperationRecord(data);
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: beforeRecord,
          after: afterRecord,
        });
      }

      if (data) await this.service.hydrateEntity(data, reqContext);
      return res.json({
        success: true,
        data,
        message: "Updated successfully",
        statusCode: 200,
      });
    } catch (error) {
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          requestBody,
          error,
        });
      }
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const logId = await OperationLogUtils.createOperationLog({
      req,
      action: "delete",
      targetEntity: this.getEntityName(),
      targetId: id,
      success: false,
      markRequestLogged: true,
    });

    try {
      const reqContext = this.service.getReqContext(req);
      const before = await this.service.findById(id, undefined, reqContext);
      await this.service.delete(id, undefined, reqContext);

      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: true,
          targetId: id,
          before: OperationLogUtils.toOperationRecord(before),
        });
      }

      return res.json({
        success: true,
        data: null,
        message: "Deleted successfully",
        statusCode: 200,
      });
    } catch (error) {
      if (logId) {
        await OperationLogUtils.finalizeOperationLog({
          logId,
          success: false,
          error,
        });
      }
      next(error);
    }
  };
}
