import { injectable, inject } from "inversify";
import { BaseService, SearchableField } from "@/shared/base/BaseService";
import { OperationLog } from "@/database/models/OperationLog";
import { LogRepository } from "./log.repository";
import { LOG_TYPES } from "./log.types";

@injectable()
export class LogService extends BaseService<OperationLog> {
  protected repository: LogRepository;
  protected searchableFields?: SearchableField<OperationLog>[] = [
    "actorSnapshot.code",
    "actorSnapshot.name",
    "actorSnapshot.phone",

    "targetSnapshot.code",
    "targetSnapshot.name",

    "endpoint",
  ];

  constructor(@inject(LOG_TYPES.LogRepository) repository: LogRepository) {
    super();
    this.repository = repository;
  }
}
