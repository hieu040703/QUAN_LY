import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { OperationLog } from "@/database/models/OperationLog";
import { LogService } from "./log.service";
import { LOG_TYPES } from "./log.types";

@injectable()
export class LogController extends BaseController<OperationLog> {
  protected service: LogService;

  constructor(@inject(LOG_TYPES.LogService) service: LogService) {
    super();
    this.service = service;
  }
}
