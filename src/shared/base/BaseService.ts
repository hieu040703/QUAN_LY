import { injectable } from "inversify";
import { ActionMap, ApiResponse, IError, RequestContext } from "@/shared/types/interfaces";
import { BaseRepository, IFindPaginationOptions } from "./BaseRepository";
import { ApiResponseHandler } from "@/shared/utils/response.utils";
import { BadRequestError, NotFoundError, ValidationError } from "@/shared/types/errors";
import { DeepPartial, EntityManager, FindManyOptions, In, Not } from "typeorm";
import { withTransaction } from "./TransactionManager";
import { BaseEntity } from "./BaseEntity";
import { Request } from "express";
import logger from "@/shared/utils/logger";
import { RepositoryFactory } from "../utils/repositoryFactory";

export interface IFindOptions<T> extends FindManyOptions<T> {
  page?: number;
  size?: number;
  keyword?: string;
  searchFields?: (keyof T)[];
  timeField?: keyof T;
  summaryFields?: (keyof T)[];
  type?: string;
  status?: string;
  startAt?: Date;
  endAt?: Date;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  branchId?: string;
  employeeId?: string;
  filterOptions?: (keyof T)[];
}
export type SearchableField<T> = keyof T | (string & {});
export type DateInput = Date | string | number | null | undefined;

@injectable()
export abstract class BaseService<T extends BaseEntity> {
  protected abstract repository: BaseRepository<T>;

  protected uniqueFields?: (keyof T)[];
  protected uniqueScope?: (keyof T)[];
  protected timeField?: keyof T & string;
  protected searchableFields?: SearchableField<T>[];
  protected summaryFields?: (keyof T | string)[];

  // ============================================================
  // Request Context
  // ============================================================

  getReqContext(req?: Request): RequestContext | undefined {
    return req
      ? {
          query: req.query,
          permissions: req.permissions,
          userContext: req.userContext,
        }
      : undefined; // Map Express Request to your RequestContext if needed
  }

  // ============================================================
  // Hydration (attach more data, actions)
  // ============================================================

  async hydrateEntities(entities: T[], req?: RequestContext) {
    await this.attachMoreDataToEntities(entities, req);
    await Promise.all(entities.map((entity) => this.attachActions(entity, req)));
  }

  async hydrateEntity(entity: T, req?: RequestContext) {
    await this.attachMoreDataToEntity(entity, req);
    await this.attachActions(entity, req);
  }

  protected async attachMoreDataToEntities(entities: T[], req?: RequestContext): Promise<void> {}

  protected async attachMoreDataToEntity(entity: T, req?: RequestContext): Promise<void> {}

  protected async attachActions(entity: T & { _actions?: ActionMap }, req?: RequestContext): Promise<void> {
    entity._actions = this.getDefaultAction();
  }

  protected getDefaultAction(): ActionMap {
    return {
      update: { can: true },
      delete: { can: true },
    };
  }

  // ============================================================
  // Lifecycle hooks (validate can mutate data, e.g. set status, load snapshots)
  // ============================================================

  protected async validateBeforeCreate(
    data: DeepPartial<T>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  async validateBeforeCreateMany(data: DeepPartial<T>[], manager: EntityManager, req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  protected async validateBeforeUpdate(
    id: string,
    data: DeepPartial<T>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  protected async validateBeforeDelete(id: string, manager: EntityManager, req?: RequestContext): Promise<void> {}

  async validateBeforeDeleteMany(ids: string[], manager: EntityManager, req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  protected async afterCreate(
    entity: T,
    data: DeepPartial<T>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  protected async afterCreateMany(data: T[], manager: EntityManager, req?: RequestContext): Promise<void> {}

  protected async afterUpdate(
    entity: T,
    data: DeepPartial<T>,
    manager: EntityManager,
    req?: RequestContext,
  ): Promise<void> {}

  protected async afterDelete(entity: T, manager: EntityManager, req?: RequestContext): Promise<void> {}

  protected async afterDeleteMany(data: T[], manager: EntityManager, req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  protected async afterCommit(data: T, req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  protected async afterCommitDelete(data: T, req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  protected async afterCommitDeleteMany(data: T[], req?: RequestContext): Promise<void> {
    // Override in subclass if needed
  }

  // ============================================================
  // CRUD Operations
  // ============================================================

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    const data = await this.repository.find(options);
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB.toFixed(2)}KB`);
    await this.attachMoreDataToEntities(data);
    return data;
  }

  async findAllWithPagination(
    options: IFindOptions<T>,
    manager?: EntityManager,
    req?: RequestContext,
  ): Promise<ApiResponse<T[]>> {
    let page = options.page || 1;
    const size = options.size || 20;
    const normalizedKeyword =
      typeof options.keyword === "string" ? options.keyword.replace(/\+/g, " ").replace(/\s+/g, " ").trim() : undefined;

    const optionData: IFindPaginationOptions<T> = {
      where: options.where,
      skip: page,
      take: size,
      order: {},
      keyword: normalizedKeyword,
      searchFields: this.searchableFields as any,
      summaryFields: options.summaryFields || (this.summaryFields as any),
      dateFilter: this.timeField as any,
      type: options.type,
      status: options.status,
      startAt: options.startAt,
      endAt: options.endAt,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      moreQuery: options,
    };

    let dataRes = await this.repository.findWithPagination(optionData, manager);

    const totalPages = Math.ceil(dataRes.total / size);
    if (page > totalPages && totalPages > 0) {
      page = totalPages;
      dataRes = await this.repository.findWithPagination({ ...optionData, skip: page }, manager);
    }

    const json = JSON.stringify(dataRes.data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB.toFixed(2)}KB`);

    return ApiResponseHandler.getSuccess(
      "OK",
      dataRes.data,
      {
        totalRecords: dataRes.total,
        size,
        currentPage: page,
        totalPages: Math.ceil(dataRes.total / size),
      },
      dataRes.summary,
    );
  }

  async findById(id: string, manager?: EntityManager, req?: RequestContext): Promise<T | null> {
    const data = await this.repository.findById(id, manager, req);
    if (data) {
      const json = JSON.stringify(data);
      const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
      logger.info(`Response size: ${sizeInKB.toFixed(2)}KB`);
    }
    return data;
  }

  async getById(id: string, manager?: EntityManager, req?: RequestContext): Promise<T> {
    const data = await this.findById(id, manager, req);
    if (!data) {
      throw new NotFoundError("Không tìm thấy dữ liệu");
    }
    return data;
  }

  async create(data: DeepPartial<T>, manager?: EntityManager, req?: RequestContext): Promise<T> {
    const runInTransaction = async (em: EntityManager) => {
      await this.validateBeforeCreate(data, em, req);
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(data as Partial<T>, this.uniqueFields, this.uniqueScope || []);
        if (errs.length > 0) throw new ValidationError("Dữ liệu không hợp lệ", errs);
      }
      // perform reference existence check if applicable
      const refErrs = await this.checkReferencesInDb?.(data, em);
      if (refErrs && refErrs.length > 0) throw new ValidationError("Dữ liệu không hợp lệ", refErrs);
      const createdEntity = await this.repository.create(data, em);
      await this.afterCreate(createdEntity, data, em, req);
      const fullData = await this.repository.findById(createdEntity.id, em);
      return fullData || createdEntity;
    };

    return manager ? runInTransaction(manager) : withTransaction(runInTransaction);
  }

  async createMany(data: DeepPartial<T>[], manager?: EntityManager, req?: RequestContext): Promise<T[]> {
    const runInTransaction = async (em: EntityManager) => {
      await this.validateBeforeCreateMany(data, em, req);
      // perform unique check if configured
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(data as any, this.uniqueFields as any, (this.uniqueScope as any) || []);
        if (errs.length > 0) throw new ValidationError("input.invalid", errs);
      }
      // perform reference existence check if applicable
      const refErrs = await this.checkReferencesInDb?.(data, em);
      if (refErrs && refErrs.length > 0) throw new ValidationError("input.invalid", refErrs);
      const createdEntity = await this.repository.createMany(data, em);
      await this.afterCreateMany(createdEntity, em, req);
      const fullData = await this.repository.findByIds(
        createdEntity.map((e) => e.id),
        em,
      );
      return fullData || createdEntity;
    };

    return manager ? runInTransaction(manager) : withTransaction(runInTransaction);
  }

  async update(id: string, data: DeepPartial<T>, manager?: EntityManager, req?: RequestContext): Promise<T | null> {
    const runInTransaction = async (em: EntityManager) => {
      await this.validateBeforeUpdate(id, data, em, req);

      // perform unique check if configured (exclude self by providing id)
      if (this.uniqueFields && this.uniqueFields.length > 0) {
        const errs = await this.checkExistInDb(
          { ...data, id } as Partial<T>,
          this.uniqueFields,
          this.uniqueScope || [],
        );
        if (errs.length > 0) throw new ValidationError("Dữ liệu không hợp lệ", errs);
      }
      // perform reference existence check for update
      const refErrs = await this.checkReferencesInDb({ ...data, id }, em);
      if (refErrs && refErrs.length > 0) throw new ValidationError("Dữ liệu không hợp lệ", refErrs);

      const updatedEntity = await this.repository.update(id, data, em);

      // Xử lý __trashFileIds: xóa các file đã bị user remove khỏi form
      if (updatedEntity && (data as any).__trashFileIds?.length > 0) {
        await this.deleteTrashFiles((data as any).__trashFileIds);
      }

      if (updatedEntity) {
        await this.afterUpdate(updatedEntity, data, em, req);
      }

      const fullData = await this.repository.findById(updatedEntity?.id || id, em);

      return fullData;
    };

    return manager ? runInTransaction(manager) : withTransaction(runInTransaction);
  }

  async delete(id: string, manager?: EntityManager, req?: RequestContext): Promise<boolean> {
    return withTransaction(async (em) => {
      const existed = await this.getById(id, em, req);
      if (existed.isDefault) throw new BadRequestError("Không thể xóa thông tin này!");
      await this.validateBeforeDelete(id, em, req);
      const result = await this.repository.softDelete(id, em);
      await this.afterDelete(existed, em, req);
      return result;
    });
  }

  async deleteMany(ids: string[], manager?: EntityManager, req?: RequestContext): Promise<boolean> {
    const deletedEntities = await this.repository.findByIds(ids, manager, req);
    const runInTransaction = async (em: EntityManager) => {
      const entities = await this.repository.findByIds(ids, manager, req);
      if (entities.length !== ids.length) {
        throw new NotFoundError("Không tìm thấy dữ liệu");
      }
      if (entities.some((e) => e.isDefault)) throw new BadRequestError(`Không thể xoá bản ghi mặc định`);

      await this.validateBeforeDeleteMany(ids, em, req);
      const result = await this.repository.deleteMany(ids, em);
      await this.afterDeleteMany(entities, em, req);

      return result;
    };

    const success = manager ? await runInTransaction(manager) : await withTransaction(runInTransaction);

    if (success) {
      await this.afterCommitDeleteMany(deletedEntities, req);
    }

    return success;
  }

  /**
   * Check exists
   */
  async exists(id: string, manager?: EntityManager): Promise<boolean> {
    return this.repository.exists({ id } as any, manager);
  }

  protected checkDuplicate<
    T extends Record<string, any>,
    K extends readonly (keyof T)[],
    S extends readonly (keyof T)[],
  >(items: T[], fields: K, prefix: string, scopes?: S): IError[] {
    const errors: IError[] = [];

    /**
     * field -> scopeKey -> value -> index
     */
    const seenMap = new Map<string, Map<string, Map<any, number>>>();

    // init
    for (const field of fields) {
      seenMap.set(field as string, new Map());
    }

    items.forEach((item, index) => {
      // tạo composite scope key
      const scopeKey = scopes?.length ? scopes.map((k) => item[k]).join("__") : "__global__";

      // nếu có scope mà thiếu value → bỏ qua
      if (scopes?.length && scopes.some((k) => item[k] === null || item[k] === undefined || item[k] === "")) {
        return;
      }

      fields.forEach((field) => {
        const fieldKey = field as string;
        const value = item[fieldKey];

        // bỏ qua null / undefined / empty string
        if (value === null || value === undefined || value === "") return;

        const fieldMap = seenMap.get(fieldKey)!;

        if (!fieldMap.has(scopeKey)) {
          fieldMap.set(scopeKey, new Map());
        }

        const scopedSeen = fieldMap.get(scopeKey)!;

        if (scopedSeen.has(value)) {
          errors.push({
            field: `${prefix}.${index}.${fieldKey}`,
            code: "DUPLICATE",
            message: "Dữ liệu bị trùng lặp",
          });
        } else {
          scopedSeen.set(value, index);
        }
      });
    });

    return errors;
  }

  /**
   * Check existence in DB for given fields with optional scope fields.
   * Example: fields = ["email","phone"], scope = ["partnerId"]
   * Will query (email AND partnerId) OR (phone AND partnerId)
   * Returns an array of IError (empty when no conflicts)
   */
  protected async checkExistInDb<T>(
    items: Partial<T>[] | Partial<T>,
    fields: (keyof T)[],
    scopeFields: (keyof T)[] = [],
  ): Promise<IError[]> {
    const itemArray = Array.isArray(items) ? items : [items];

    const errors: IError[] = [];

    for (let i = 0; i < itemArray.length; i++) {
      const item = itemArray[i];

      const orConditions: any[] = [];

      for (const field of fields) {
        const value = item[field];

        if (value == null || value === "") continue;

        orConditions.push({
          [String(field)]: value,
        });
      }

      if (!orConditions.length) continue;

      const baseWhere: any = {
        deletedAt: null,
      };

      for (const s of scopeFields) {
        const scopeValue = item[s];

        if (scopeValue != null) {
          baseWhere[String(s)] = scopeValue;
        }
      }

      if ("id" in item && item.id) {
        baseWhere.id = Not(item.id);
      }

      const found = (await this.repository.findByOptions({
        where: orConditions.map((or) => ({
          ...baseWhere,
          ...or,
        })),
      })) as unknown as T[];

      if (found.length > 0) {
        for (const field of fields) {
          const val = item[field];

          const exists = found.find((f) => val != null && f[field] === val);

          if (exists) {
            errors.push({
              field: String(field),
              code: "EXISTS",
              message: "Dữ liệu đã tồn tại",
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check foreign-key references in DB for tenant entities.
   * Batches checks per related-entity to minimize queries (1 query per related entity).
   */
  protected async checkReferencesInDb(
    items: DeepPartial<T> | DeepPartial<T>[] | Partial<T> | Partial<T>[],
    manager?: EntityManager,
  ): Promise<IError[]> {
    const itemArray = Array.isArray(items) ? items : [items];
    const errors: IError[] = [];
    // get root repo metadata
    const rootRepo = this.repository.getRepository(manager);
    const entityMetadata = rootRepo.metadata;

    // map possible fk keys -> related entity name
    const relationIdToEntityMap: Record<string, string> = {};
    entityMetadata.relations.forEach((relation) => {
      const joinColumn = relation.joinColumns?.[0];
      const propKey = `${relation.propertyName}Id`;
      if (joinColumn?.databaseName)
        relationIdToEntityMap[joinColumn.databaseName] = relation.inverseEntityMetadata.name;
      relationIdToEntityMap[propKey] = relation.inverseEntityMetadata.name;
    });

    // collect ids per related entity and track occurrences
    const occurrences: Record<string, Map<string, Array<{ index: number; field: string }>>> = {};

    for (let i = 0; i < itemArray.length; i++) {
      const item: any = itemArray[i];
      for (const key of Object.keys(item)) {
        if (!key.endsWith("Id")) continue;
        const relatedEntity = relationIdToEntityMap[key];
        if (!relatedEntity) continue;
        const idValue = item[key];
        if (!idValue) continue;

        occurrences[relatedEntity] = occurrences[relatedEntity] || new Map();
        const mapForEntity = occurrences[relatedEntity];
        const idStr = String(idValue);
        if (!mapForEntity.has(idStr)) mapForEntity.set(idStr, []);
        mapForEntity.get(idStr)!.push({ index: i, field: key });
      }
    }

    if (Object.keys(occurrences).length === 0) return errors;

    const repoMap = RepositoryFactory.getRepositories();

    // For each related entity, batch check IDs
    await Promise.all(
      Object.keys(occurrences).map(async (relatedEntity) => {
        const idMap = occurrences[relatedEntity];
        const ids = Array.from(idMap.keys());
        const repo = repoMap[relatedEntity];
        if (!repo) {
          // mark all as not found
          idMap.forEach((arr) => {
            arr.forEach((occ) =>
              errors.push({
                field: occ.field,
                code: "NOT_FOUND",
                message: "Không tìm thấy dữ liệu",
              }),
            );
          });
          return;
        }

        // query existing ids in tenant schema
        const found = await repo.findByOptions({
          where: { id: In(ids as any), deletedAt: null } as any,
        });

        const foundIds = new Set(found.map((f: any) => String(f.id)));

        idMap.forEach((arr, id) => {
          if (!foundIds.has(id)) {
            arr.forEach((occ) =>
              errors.push({
                field: occ.field,
                code: "NOT_FOUND",
                message: "Không tìm thấy dữ liệu",
              }),
            );
          }
        });
      }),
    );

    return errors;
  }

  getEarliestDate(d1?: DateInput, d2?: DateInput): Date {
    const t1 = d1 != null ? new Date(d1).getTime() : null;
    const t2 = d2 != null ? new Date(d2).getTime() : null;

    if (t1 == null && t2 == null) {
      return new Date(0); // epoch
    }

    if (t1 == null) return new Date(t2!);
    if (t2 == null) return new Date(t1);

    return new Date(Math.min(t1, t2));
  }

  collectUniqueIds(ids: Array<string | null | undefined>): string[] {
    return Array.from(new Set(ids.filter((id): id is string => typeof id === "string" && id.trim() !== "")));
  }

  // Tạo key cho lỗi
  protected createErrorKeyForArray(arrayField: string, field: string, index: number): string {
    return `${arrayField}.${index}.${field}`;
  }

  /**
   * Delete trash files (__trashFileIds) after entity update.
   * Uses dynamic import to avoid circular dependency with FileService.
   */
  protected async deleteTrashFiles(fileIds: string[]): Promise<void> {
    try {
      const { FileService } = await import("@/modules/file/file.service.js");
      const { default: container } = await import("@/config/container.js");
      // Simple approach: use the repository directly
      const { DatabaseConfig } = await import("@/config/database.js");
      const { FileEntity, FileStatus } = await import("@/database/models/File.js");
      const repo = DatabaseConfig.getRepository(FileEntity);

      for (const id of fileIds) {
        try {
          // Soft-delete file từ DB
          await repo.softDelete(id);
        } catch (err) {
          // Silent fail
        }
      }
    } catch {
      // Silent fail — trash file deletion is best-effort
    }
  }
}
