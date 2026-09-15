import {
  Repository,
  EntityTarget,
  FindOptionsWhere,
  DeepPartial,
  EntityManager,
  FindManyOptions,
  IsNull,
  DataSource,
  FindOneOptions,
  FindOptionsRelations,
  SelectQueryBuilder,
  Brackets,
  In,
} from "typeorm";
import { DatabaseConfig } from "@/config/database";
import { NotFoundError } from "@/shared/types/errors";
import { injectable } from "inversify";
import {
  OPERATOR_MAP,
  rangeSuffixes,
  RequestContext,
  ISummaryCountCase,
  ISummaryCountMap,
  ISummarySumCase,
} from "@/shared/types/interfaces";
import { BaseEntity } from "./BaseEntity";
import { RelationSelectConfig } from "./BaseSelect";
import logger from "../utils/logger";
import { generateCode } from "../utils/code.utils";
import { FileStatus } from "../constants/enum";
import fs from "fs/promises";

export interface IFindPaginationOptions<T> extends FindManyOptions<T> {
  keyword?: string;
  searchFields?: (keyof T | string)[];
  type?: string;
  status?: string;
  startAt?: Date;
  endAt?: Date;
  dateFilter?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  branchId?: string;
  filterOptions?: (keyof T)[];
  filterDate?: string;
  summaryFields?: (keyof T | string)[];
  summarySumCases?: ISummarySumCase<T>[];
  summaryCountCases?: ISummaryCountCase<T>[];
  summaryCountMap?: ISummaryCountMap<T>;
  moreQuery?: any;
}

@injectable()
export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract entityClass: EntityTarget<T>;
  protected dataSource: DataSource;
  protected enableFileAttachment: boolean = true;
  /**
   * Cho phép nhiều file cùng category cho 1 entity
   * - false (default): Mỗi entity chỉ được 1 file/category tại 1 thời điểm (giữ file mới nhất)
   * - true: Không giới hạn số file
   */
  protected multipleFile: boolean = false;
  /**
   * Danh sách các trường nested (object[] hoặc object) trên entity mà
   * repo con có thể khai báo để BaseRepository gắn files cho các phần tử con.
   *
   * Hỗ trợ path notation để chỉ định chính xác entity cần load files:
   * - ['variants'] → gắn file cho từng variant
   * - ['lines.ingredient'] → gắn file cho ingredient trong mỗi orderLine
   * - ['lines', 'lines.ingredient'] → gắn file cho cả orderLine và ingredient
   *
   * Nếu không khai báo, repository sẽ fallback quét mọi trường để phát hiện mảng object có `id`.
   *
   * ⚠️ LƯU Ý: Nested entities LUÔN chỉ giữ 1 file/category (bất kể multipleFile của parent)
   */
  protected nestedFileFields?: string[];
  protected withBranchId: boolean = false;

  /**
   * Select fields cho detail query (findById, findOne)
   */
  protected selectedFields?: any;

  /**
   * Select fields cho list query (find, findAll, findWithPagination)
   */
  protected selectedFieldsForList?: any;

  /**
   * Relations cho detail query (findById, findOne).
   * Dùng FindOptionsRelations như cũ.
   */
  protected relations?: FindOptionsRelations<T>;

  /**
   * Relations cho list query.
   */
  protected relationsForList?: FindOptionsRelations<T>;

  /**
   * *** IMPROVED: Relation select config ***
   * Cho phép chỉ định chính xác field cần select từ mỗi relation.
   *
   * Ví dụ:
   * ```
   * protected relationSelects: RelationSelectConfig = {
   *   customer: ["id", "name", "code", "phone"],
   *   machine: ["id", "code", "model"],
   *   createdBy: ["id", "firstName", "lastName"],
   * };
   * ```
   *
   * Nếu relation có trong `relations` nhưng không có trong `relationSelects`,
   * sẽ lấy tất cả field (giữ nguyên behavior cũ).
   * Nếu relation có trong `relationSelects` = false, sẽ không join.
   */
  protected relationSelects?: RelationSelectConfig<T>;

  /**
   * Relation select config cho list query (fallback về relationSelects nếu không set)
   */
  protected relationSelectsForList?: RelationSelectConfig<T>;

  protected summaryCountCases?: ISummaryCountCase<T>[];
  protected summaryCountMap?: ISummaryCountMap<T>;
  protected summarySumCases?: ISummarySumCase<T>[];
  protected summaryFields?: (keyof T | string)[];
  protected summaryFieldExpressions?: Record<string, string>;
  protected summaryFieldAggregates?: Record<string, string>;

  protected sortOrderScope?: keyof T; // Các trường dùng để phân scope khi tính sortOrder

  // ============================================================
  // Hooks - override trong repo con
  // ============================================================

  protected async extendQueryBuilder(qb: SelectQueryBuilder<T>, options: IFindPaginationOptions<T>): Promise<void> {}

  protected async extendQueryBuilderForList(
    qb: SelectQueryBuilder<T>,
    options: IFindPaginationOptions<T>,
  ): Promise<void> {}

  // ============================================================
  // Helper methods
  // ============================================================

  private isTextLikeColumnType(columnType: unknown): boolean {
    const normalizedType =
      typeof columnType === "string"
        ? columnType.toLowerCase()
        : typeof columnType === "function"
          ? (columnType as any).name?.toLowerCase()
          : String(columnType).toLowerCase();

    return ["string", "text", "varchar", "char", "character", "character varying", "citext"].includes(normalizedType);
  }

  /**
   * *** IMPROVED: Join relations với selective field picking ***
   *
   * Thay vì dùng `leftJoinAndSelect` (lấy tất cả field),
   * method này dùng `leftJoin` + `addSelect` để chỉ lấy field được chỉ định.
   *
   * Cách dùng:
   * - relationSelects: { customer: ["id", "name"], machine: true }
   *   + customer: chỉ lấy id, name
   *   + machine: lấy tất cả field (true = full select)
   * - Nếu không có relationSelects, fallback về leftJoinAndSelect (full field)
   */
  protected joinRelationsWithSelect(
    qb: SelectQueryBuilder<T>,
    relations: FindOptionsRelations<T> | undefined,
    relationSelects: RelationSelectConfig<T> | undefined,
    parentAlias: string = "entity",
    selectiveAliases?: Set<string>,
  ): void {
    if (!relations || typeof relations === "boolean") return;

    for (const relationKey of Object.keys(relations)) {
      const relationValue = (relations as any)[relationKey];
      const relationAlias = `${parentAlias}_${relationKey}`;
      const selectConfig = relationSelects?.[relationKey as keyof T];

      // Nếu selectConfig = false, skip relation này
      if (selectConfig === false) continue;

      // Nếu có select config dạng array (danh sách field)
      if (Array.isArray(selectConfig)) {
        // Dùng leftJoin thay vì leftJoinAndSelect
        qb.leftJoin(`${parentAlias}.${relationKey}`, relationAlias);

        // Track this alias as selectively joined (needs flat-object reconstruction)
        if (selectiveAliases) {
          selectiveAliases.add(relationAlias);
        }

        // Chỉ select những field được chỉ định
        const fields = selectConfig as string[];
        for (const field of fields) {
          qb.addSelect(`${relationAlias}.${field}`, `${relationAlias}_${field}`);
        }

        // Nếu có nested relations và nested select config
        if (relationValue && typeof relationValue === "object") {
          const nestedSelects =
            typeof selectConfig === "object" && !Array.isArray(selectConfig) ? selectConfig : undefined;
          this.joinRelationsWithSelect(
            qb,
            relationValue,
            nestedSelects as RelationSelectConfig<T> | undefined,
            relationAlias,
            selectiveAliases,
          );
        }
      } else if (typeof selectConfig === "object" && !Array.isArray(selectConfig)) {
        // SelectConfig là object chứa nested config (ví dụ: { customer: { contacts: ["id", "name"] } })
        qb.leftJoinAndSelect(`${parentAlias}.${relationKey}`, relationAlias);

        if (relationValue && typeof relationValue === "object") {
          this.joinRelationsWithSelect(qb, relationValue, selectConfig as RelationSelectConfig<T>, relationAlias);
        }
      } else {
        // Không có select config hoặc selectConfig = true => lấy tất cả field (behavior cũ)
        qb.leftJoinAndSelect(`${parentAlias}.${relationKey}`, relationAlias);

        // Đệ quy nếu có nested relations
        if (relationValue && typeof relationValue === "object") {
          this.joinRelationsWithSelect(qb, relationValue, undefined, relationAlias);
        }
      }
    }
  }

  /**
   * Legacy method - để tương thích với code cũ
   * @deprecated Dùng joinRelationsWithSelect thay thế
   */
  protected joinRelations(
    qb: SelectQueryBuilder<T>,
    relations: FindOptionsRelations<T> | boolean,
    parentAlias: string = "entity",
  ): void {
    if (!relations || typeof relations === "boolean") return;

    Object.keys(relations).forEach((relationKey) => {
      const relationValue = (relations as any)[relationKey];
      const relationAlias = `${parentAlias}_${relationKey}`;

      qb.leftJoinAndSelect(`${parentAlias}.${relationKey}`, relationAlias);

      if (relationValue && typeof relationValue === "object") {
        this.joinRelations(qb, relationValue, relationAlias);
      }
    });
  }

  /**
   * Map raw results back to entities, reconstructing relation objects
   * from flat raw keys when selective relation fields are used.
   *
   * Handles both ManyToOne (single object) and OneToMany (array) relations
   * by grouping results by entity primary key and collecting array relations
   * across all rows.
   */
  protected mapRawEntities(
    rawAndEntities: {
      entities: T[];
      raw: any[];
    },
    qb?: SelectQueryBuilder<T>,
    selectiveAliases?: Set<string>,
    customSelectAliases?: Set<string>,
  ): any[] {
    const aliasMap = this.buildAliasMap(qb);

    // Detect which relations are OneToMany/ManyToMany (needs array grouping)
    const relationIsArray: Record<string, boolean> = {};
    if (qb) {
      try {
        const mainMetadata = (qb as any).expressionMap?.mainAlias?.metadata;
        if (mainMetadata) {
          for (const [alias, relName] of Object.entries(aliasMap)) {
            const relation = mainMetadata.findRelationWithPropertyPath(relName);
            relationIsArray[alias] = relation?.isMany === true;
          }
        }
      } catch {
        // Best-effort: fall back to single-object reconstruction
      }
    }

    // Group by entity ID to handle OneToMany relations
    const grouped = new Map<string, { entity: T; raws: any[] }>();

    rawAndEntities.entities.forEach((entity, index) => {
      const id = (entity as any).id;
      if (!grouped.has(id)) {
        grouped.set(id, { entity, raws: [] });
      }
      grouped.get(id)!.raws.push(rawAndEntities.raw[index]);
    });

    return Array.from(grouped.values()).map(({ entity, raws }) => {
      const result: any = { ...entity };
      const extras: any = {};

      // Map summary extras from all rows (take first non-undefined)
      for (const raw of raws) {
        Object.keys(raw).forEach((key) => {
          if (customSelectAliases?.has(key) && extras[key] === undefined) {
            extras[key] = raw[key];
          }
          if (key.startsWith("entity_total")) {
            const field = key.replace("entity_", "");
            if (extras[field] === undefined) {
              extras[field] = Number(raw[key] || "0");
            }
          }
          if (key.startsWith("entity_") && key.endsWith("Rank")) {
            const field = key.replace("entity_", "");
            if (extras[field] === undefined) {
              extras[field] = Number(raw[key] || "0");
            }
          }
        });
      }
      Object.assign(result, extras);

      // Reconstruct relation objects from raw flat keys
      // Only reconstruct selectively-joined relations (leftJoin + addSelect);
      // skip leftJoinAndSelect relations that TypeORM already populated correctly.
      for (const [aliasName, relationName] of Object.entries(aliasMap)) {
        // Skip relations that were joined with leftJoinAndSelect (already populated)
        if (selectiveAliases && !selectiveAliases.has(aliasName)) continue;

        const isArray = relationIsArray[aliasName] === true;

        if (isArray) {
          // OneToMany/ManyToMany: collect from all rows, filter out null-id entries
          const items: Record<string, any>[] = [];
          for (const raw of raws) {
            const relationFields: Record<string, any> = {};
            Object.keys(raw).forEach((key) => {
              if (key.startsWith(`${aliasName}_`)) {
                const field = key.substring(aliasName.length + 1);
                if (raw[key] !== undefined && raw[key] !== null) {
                  relationFields[field] = raw[key];
                }
              }
            });
            // Only include if this row contributed a meaningful related entity
            if (relationFields["id"]) {
              items.push(relationFields);
            }
          }
          if (items.length > 0) {
            result[relationName] = items;
          }
        } else {
          // ManyToOne/OneToOne: take from first row only
          const raw = raws[0];
          const relationFields: Record<string, any> = {};

          Object.keys(raw).forEach((key) => {
            if (key.startsWith(`${aliasName}_`)) {
              const field = key.substring(aliasName.length + 1);
              if (raw[key] !== undefined) {
                relationFields[field] = raw[key];
              }
            }
          });

          const fieldKeys = Object.keys(relationFields).filter((k) => k !== "id" && relationFields[k] != null);
          const shouldSet = fieldKeys.length > 0 || relationFields["id"] != null;
          if (shouldSet) {
            result[relationName] = relationFields;
          }
        }
      }

      return result;
    });
  }

  /**
   * Build a map from SQL alias to relation property name from the query builder.
   */
  private buildAliasMap(qb?: SelectQueryBuilder<T>): Record<string, string> {
    const map: Record<string, string> = {};
    if (!qb) return map;

    try {
      const expressionMap = (qb as any).expressionMap;
      if (expressionMap?.joinAttributes) {
        for (const join of expressionMap.joinAttributes) {
          const alias = join?.alias?.name;
          const relation = join?.relation?.propertyName;
          if (alias && relation && alias !== "entity") {
            map[alias] = relation;
          }
        }
      }
    } catch {
      // Silently fail - mapping is best-effort
    }

    return map;
  }

  constructor() {
    this.dataSource = DatabaseConfig;
  }

  // ============================================================
  // Repository access
  // ============================================================

  public getRepository(manager?: EntityManager): Repository<T> {
    if (manager) {
      return manager.getRepository(this.entityClass);
    }
    return this.dataSource.getRepository(this.entityClass);
  }

  // ============================================================
  // CRUD Operations
  // ============================================================

  async find(options?: FindManyOptions<T>, manager?: EntityManager): Promise<T[]> {
    const repo = this.getRepository(manager);
    const finalOptions: FindManyOptions<T> = {
      ...options,
      select: options?.select || this.selectedFieldsForList || this.selectedFields,
      relations: options?.relations || this.relationsForList || this.relations,
    };
    return repo.find(finalOptions);
  }

  async findOne(options: FindOneOptions<T>, manager?: EntityManager): Promise<T | null> {
    const repo = this.getRepository(manager);
    const finalOptions: FindOneOptions<T> = {
      ...options,
      select: options?.select || this.selectedFields,
      relations: options?.relations || this.relations,
    };
    return repo.findOne(finalOptions);
  }

  async findById(
    id: string,
    manager?: EntityManager,
    req?: RequestContext,
    includeDeleted: boolean = false,
  ): Promise<T | null> {
    const repo = this.getRepository(manager);

    if (this.extendQueryBuilder === BaseRepository.prototype.extendQueryBuilder && !this.relationSelects) {
      const options: FindOneOptions<T> = {
        where: { id } as any,
        select: this.selectedFields,
        relations: this.relations,
      };
      if (!includeDeleted) {
        (options.where as any).deletedAt = IsNull();
      } else {
        options.withDeleted = true;
      }
      return repo.findOne(options);
    }

    // Dùng query builder với relation selects
    const qb = repo.createQueryBuilder("entity");
    qb.where("entity.id = :id", { id });

    if (!includeDeleted) {
      qb.andWhere("entity.deletedAt IS NULL");
    } else {
      qb.withDeleted();
    }

    // Join relations với selective field picking
    const rels = this.relations;
    const relSelects = this.relationSelects;
    const hasSelectiveRelations = !!(relSelects && Object.values(relSelects).some((v) => Array.isArray(v)));

    const selectiveAliases = new Set<string>();

    if (rels && relSelects) {
      this.joinRelationsWithSelect(qb, rels, relSelects, "entity", selectiveAliases);
    } else if (rels) {
      this.joinRelations(qb, rels, "entity");
    }

    const query = (req?.query as any) || {};
    await this.extendQueryBuilder(qb, { ...query, moreQuery: query });

    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const hasExtraSelect = (qb as any).expressionMap?.selects?.some((s: any) => s.aliasName?.startsWith("entity_"));

    let entity: T | null;
    if (hasGroupBy || hasExtraSelect || hasSelectiveRelations) {
      const rawAndEntities = await qb.getRawAndEntities();
      const data = this.mapRawEntities(rawAndEntities, qb, selectiveAliases);
      entity = data[0] || null;
    } else {
      entity = await qb.getOne();
    }

    // Auto-attach files from MasterFile
    if (entity && this.enableFileAttachment) {
      return await this.attachFilesToEntity(entity);
    }

    return entity;
  }

  async getById(id: string, manager?: EntityManager): Promise<T> {
    const entity = await this.findOne(
      {
        where: { id } as any,
        select: this.selectedFields,
        relations: this.relations,
      },
      manager,
    );
    if (!entity) {
      throw new NotFoundError("Không tìm thấy dữ liệu");
    }
    return entity;
  }

  async findByIds(
    ids: string[],
    manager?: EntityManager,
    req?: RequestContext,
    includeDeleted: boolean = false,
  ): Promise<T[]> {
    if (!ids || ids.length === 0) return [];

    const repo = this.getRepository(manager);

    // ================== SIMPLE MODE ==================
    if (this.extendQueryBuilder === BaseRepository.prototype.extendQueryBuilder) {
      const where: any = {
        id: In(ids),
      };

      if (!includeDeleted) {
        where.deletedAt = IsNull();
      }

      const options: FindManyOptions<T> = {
        where,
        select: this.selectedFields,
        relations: this.relations,
        ...(includeDeleted ? { withDeleted: true } : {}),
      };

      let entities = await repo.find(options);

      if (this.enableFileAttachment && entities.length) {
        entities = await Promise.all(entities.map((e) => this.attachFilesToEntity(e)));
      }

      return entities;
    }

    // ================== QUERY BUILDER MODE ==================
    const qb = repo.createQueryBuilder("entity");
    qb.where("entity.id IN (:...ids)", { ids });

    // Soft delete
    if (!includeDeleted) {
      qb.andWhere("entity.deletedAt IS NULL");
    } else {
      qb.withDeleted();
    }

    // Join relations với selective field picking
    const rels = this.relations;
    const relSelects = this.relationSelects;
    const hasSelectiveRelations = !!(relSelects && Object.values(relSelects).some((v) => Array.isArray(v)));

    const selectiveAliases = new Set<string>();

    if (rels && relSelects) {
      this.joinRelationsWithSelect(qb, rels, relSelects, "entity", selectiveAliases);
    } else if (rels) {
      this.joinRelations(qb, rels, "entity");
    }

    const query = (req?.query as any) || {};
    await this.extendQueryBuilder(qb, { ...query, moreQuery: query });

    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const customSelectAliases = new Set<string>(
      ((qb as any).expressionMap?.selects || [])
        .map((s: any) => s.aliasName)
        .filter((alias: unknown): alias is string => typeof alias === "string" && !alias.startsWith("entity_")),
    );
    const hasExtraSelect =
      customSelectAliases.size > 0 ||
      (qb as any).expressionMap?.selects?.some((s: any) => s.aliasName?.startsWith("entity_"));

    let entities: T[] = [];
    if (hasGroupBy || hasExtraSelect) {
      const rawAndEntities = await qb.getRawAndEntities();
      entities = this.mapRawEntities(rawAndEntities);
    } else {
      entities = await qb.getMany();
    }

    // Attach files
    if (this.enableFileAttachment && entities.length) {
      entities = await Promise.all(entities.map((e) => this.attachFilesToEntity(e)));
    }

    return entities;
  }

  async findAll(manager?: EntityManager, includeDeleted = false): Promise<T[]> {
    const options: FindManyOptions<T> = {
      select: this.selectedFieldsForList || this.selectedFields,
      relations: this.relationsForList || this.relations,
    };
    if (!includeDeleted) {
      options.where = { deletedAt: IsNull() } as any;
    } else {
      options.withDeleted = true;
    }
    return this.getRepository(manager).find(options);
  }

  // ============================================================
  // *** IMPROVED: findWithPagination với selective relation ***
  // ============================================================

  async findWithPagination(
    options: IFindPaginationOptions<T>,
    manager?: EntityManager,
    includeDeleted = false,
  ): Promise<{ data: T[]; total: number; summary?: any }> {
    const page = options.skip || 1;
    const size = options.take || 20;

    const repository = this.getRepository(manager);
    const qb = repository.createQueryBuilder("entity");

    // ===== JOIN RELATIONS với selective field =====
    const defaultRelations = this.relationsForList || this.relations;
    const defaultRelationSelects = this.relationSelectsForList || this.relationSelects;
    const allRelations: Record<string, any> = {
      ...defaultRelations,
      ...options.relations,
    };

    const selectiveAliases = new Set<string>();

    if (allRelations && Object.keys(allRelations).length > 0) {
      if (defaultRelationSelects) {
        this.joinRelationsWithSelect(qb, allRelations as any, defaultRelationSelects, "entity", selectiveAliases);
      } else {
        this.joinRelations(qb, allRelations as any, "entity");
      }
    }

    // ===== KEYWORD SEARCH =====
    if (options.keyword) {
      let textSearchableFields: string[] = [];

      const resolveFieldAlias = (field: string): string | null => {
        const parts = field.split(".").filter(Boolean);
        if (parts.length === 0) return null;
        if (parts.length === 1) return `entity.${parts[0]}`;

        // Relation field (vd "workOrder.title", "workOrder.customer.name")
        // Alias được tạo theo pattern `${parentAlias}_${relationKey}` trong
        // joinRelations / joinRelationsWithSelect → "entity_workOrder", "entity_workOrder_customer".
        const fieldName = parts[parts.length - 1];
        const relationAlias = parts.slice(0, -1).reduce((acc, part) => `${acc}_${part}`, "entity");
        return `${relationAlias}.${fieldName}`;
      };

      if (options.searchFields && options.searchFields.length > 0) {
        textSearchableFields = options.searchFields
          .map((f) => resolveFieldAlias(String(f)))
          .filter(Boolean) as string[];
      } else {
        const autoDetectedFields = repository.metadata.columns
          .filter((column) => this.isTextLikeColumnType(column.type))
          .map((column) => `entity.${column.propertyName}`);
        textSearchableFields.push(...autoDetectedFields);
      }

      if (textSearchableFields.length > 0) {
        qb.andWhere(
          new Brackets((qb1) => {
            textSearchableFields.forEach((field, idx) => {
              const isLikelyUuidField = field.toLowerCase().includes("id");
              const fieldExpression = isLikelyUuidField ? `CAST(${field} AS TEXT)` : field;
              const normalizedFieldExpression = `unaccent(lower(COALESCE(${fieldExpression}, '')))`;
              const condition = `${normalizedFieldExpression} ILIKE unaccent(lower(:keyword))`;

              if (idx === 0) {
                qb1.where(condition, { keyword: `%${options.keyword}%` });
              } else {
                qb1.orWhere(condition);
              }
            });
          }),
        );
      }
    }

    await this.extendQueryBuilder(qb, options);
    await this.extendQueryBuilderForList(qb, options);

    // ===== BRANCH FILTER =====
    if (options.branchId && this.withBranchId) {
      const entityMetadata = repository.metadata;
      const hasBranchIdColumn = entityMetadata.columns.some((col) => col.propertyName === "branchId");
      if (hasBranchIdColumn) {
        qb.andWhere("entity.branchId = :branchId", {
          branchId: options.branchId,
        });
      }
    }

    // ===== RANGE FILTERS =====
    const rangeFilterSource = options.moreQuery || options;
    if (rangeFilterSource && typeof rangeFilterSource === "object") {
      const entityColumns = repository.metadata.columns.map((col) => col.propertyName);

      Object.keys(rangeFilterSource).forEach((key) => {
        const matchedSuffix = rangeSuffixes.find((suffix) => key.endsWith(suffix));
        if (matchedSuffix) {
          const fieldName = key.slice(0, -matchedSuffix.length);
          if (entityColumns.includes(fieldName)) {
            const value = rangeFilterSource[key];
            if (value != null && value !== "") {
              const operator = OPERATOR_MAP[matchedSuffix];
              const paramName = `${fieldName}_${matchedSuffix}`;
              qb.andWhere(`entity.${fieldName} ${operator} :${paramName}`, {
                [paramName]: value,
              });
            }
          }
        }
      });
    }

    if (options.type !== undefined) {
      // Only apply `type` filter when the entity actually has a `type` column
      const hasTypeColumn = repository.metadata.columns.some((col) => col.propertyName === "type");
      if (hasTypeColumn) {
        qb.andWhere("entity.type = :type", { type: options.type });
      }
    }

    // BETWEEN createdAt
    if (options.startAt && options.endAt && options.dateFilter) {
      const dateField = options.dateFilter;
      qb.andWhere(`entity.${dateField} BETWEEN :start AND :end`, {
        start: new Date(options.startAt),
        end: new Date(options.endAt),
      });
    }

    if (includeDeleted) {
      qb.andWhere("entity.deletedAt IS NOT NULL");
      qb.withDeleted();
    } else {
      qb.andWhere("entity.deletedAt IS NULL");
    }

    // Summary status counts must be calculated before the selected status filter.
    // Otherwise, for example, status=ACTIVE makes every other status count equal 0.
    const summaryCasesForQuery = options.summaryCountCases || this.summaryCountCases;
    const summaryCountBaseQb = summaryCasesForQuery?.length ? qb.clone() : undefined;

    if (options.status !== undefined) {
      qb.andWhere("entity.status = :status", { status: options.status });
    }

    // ===== SORT =====
    if (options.sortBy) {
      const sortField = options.sortBy.includes(".") ? options.sortBy : `entity.${options.sortBy}`;
      qb.orderBy(sortField, options.sortOrder || "ASC");
    } else if (Object.keys((qb as any).expressionMap?.orderBys || {}).length === 0) {
      qb.orderBy("entity.createdAt", "DESC");
    }

    // ===== PAGINATION =====
    const skip = (page - 1) * size;
    qb.skip(skip).take(size);

    // ===== EXECUTE =====
    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const customSelectAliases = new Set<string>(
      ((qb as any).expressionMap?.selects || [])
        .map((s: any) => s.aliasName)
        .filter((alias: unknown): alias is string => typeof alias === "string" && !alias.startsWith("entity_")),
    );
    const hasExtraSelect =
      customSelectAliases.size > 0 ||
      (qb as any).expressionMap?.selects?.some((s: any) => s.aliasName?.startsWith("entity_"));
    // Detect if selective relation fields are used (non-full relation selects)
    const hasRelationSelects = !!(
      defaultRelationSelects &&
      Object.keys(defaultRelationSelects).length > 0 &&
      Object.values(defaultRelationSelects).some((v) => Array.isArray(v))
    );

    let data: T[];
    let total: number;

    if (hasGroupBy || hasExtraSelect || hasRelationSelects) {
      // Use raw + entities + manual mapping when selective relations are involved
      const rawAndEntities = await qb.getRawAndEntities();
      data = this.mapRawEntities(rawAndEntities, qb, selectiveAliases, customSelectAliases) as T[];

      // Count query: preserve all filters applied to the data query.
      const countQb = qb.clone();
      countQb.skip(undefined).take(undefined).orderBy().select("entity.id");
      total = await countQb.getCount();
    } else {
      const [result, count] = await qb.getManyAndCount();
      data = result;
      total = count;
    }

    if (this.enableFileAttachment && data.length) {
      data = await this.attachFilesToEntities(data);
    }

    // ===== SUMMARY =====
    let summary: any = undefined;
    const summaryFields = options.summaryFields || this.summaryFields;
    const summaryCases = options.summaryCountCases || this.summaryCountCases;
    const summaryMap = options.summaryCountMap || this.summaryCountMap;
    const summarySums = options.summarySumCases || this.summarySumCases;

    if (summaryFields?.length || summaryCases || summaryMap || summarySums) {
      summary = {};

      // SUM các field trên toàn bộ tập dữ liệu đã filter, không phụ thuộc pagination.
      if (summaryFields?.length) {
        const summaryQb = qb.clone();
        summaryQb.skip(undefined).take(undefined).orderBy().groupBy().select([]);

        const summaryEntries = summaryFields.map((field, index) => {
          const requestedField = String(field);
          const column = repository.metadata.columns.find(
            (item) => item.propertyName.toLowerCase() === requestedField.toLowerCase(),
          );
          const expression = this.summaryFieldExpressions?.[requestedField];
          const aggregateExpression = this.summaryFieldAggregates?.[requestedField];
          const alias = `summary_${index}`;

          if (!column && !expression && !aggregateExpression) {
            summary[requestedField] = 0;
            return null;
          }

          summaryQb.addSelect(
            aggregateExpression
              ? `COALESCE(${aggregateExpression}, 0)`
              : `COALESCE(SUM(${expression || `entity.${column!.propertyName}`}), 0)`,
            alias,
          );
          return { requestedField, alias };
        });

        const summaryRaw = await summaryQb.getRawOne<Record<string, unknown>>();
        for (const entry of summaryEntries) {
          if (entry) summary[entry.requestedField] = Number(summaryRaw?.[entry.alias] ?? 0);
        }
      }

      // Count cases sau các filter khác, không phụ thuộc page hoặc status hiện tại.
      if (summaryCases?.length) {
        // Use the query before the selected status filter so the status breakdown
        // remains useful while the list itself is filtered by one status.
        const summaryCountQb = (summaryCountBaseQb || qb).clone();
        summaryCountQb.skip(undefined).take(undefined).orderBy().select([]);

        const summaryCountEntries = summaryCases.map((c, index) => {
          const field = String(c.field);
          const summaryKey = `${c.key}Count`;
          const column = repository.metadata.columns.find(
            (item) => item.propertyName.toLowerCase() === field.toLowerCase(),
          );
          const alias = `summary_count_${index}`;

          if (!column) {
            summary[summaryKey] = 0;
            return null;
          }

          const columnExpression = `entity.${column.propertyName}`;
          const parameterName = `summary_count_value_${index}`;
          const condition = c.value === null
            ? `${columnExpression} IS NULL`
            : `${columnExpression} = :${parameterName}`;

          summaryCountQb.addSelect(
            `COUNT(DISTINCT CASE WHEN ${condition} THEN entity.id END)`,
            alias,
          );
          if (c.value !== null) summaryCountQb.setParameter(parameterName, c.value);

          return { summaryKey, alias };
        });

        const summaryRaw = await summaryCountQb.getRawOne<Record<string, unknown>>();
        for (const entry of summaryCountEntries) {
          if (entry) summary[entry.summaryKey] = Number(summaryRaw?.[entry.alias] ?? 0);
        }
      }

      // Count map
      if (summaryMap) {
        for (const [field, values] of Object.entries(summaryMap)) {
          if (Array.isArray(values)) {
            for (const val of values) {
              const key =
                val === null ? "nullCount" : `${String(val).charAt(0).toLowerCase() + String(val).slice(1)}Count`;
              summary[`${field}_${key}`] = data.filter((item: any) => item[field] === val).length;
            }
          }
        }
      }
    }

    return { data, total, summary };
  }

  async findByOptions(options: FindManyOptions<T>, manager?: EntityManager): Promise<T[]> {
    const data = await this.getRepository(manager).find(options);
    if (this.enableFileAttachment && Array.isArray(data)) return await this.attachFilesToEntities(data);
    return data;
  }

  async findByOption(
    options: FindOneOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<T | null> {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: IsNull() } as any;
    }

    const data = await this.getRepository(manager).findOne(options);
    if (data && this.enableFileAttachment) await this.attachFilesToEntity(data);
    return data;
  }

  // ============================================================
  // Write Operations
  // ============================================================

  async create(data: DeepPartial<T>, manager?: EntityManager, req?: RequestContext): Promise<T> {
    const repo = this.getRepository(manager);
    const entityInfo = repo.metadata;
    const entityName = entityInfo?.name || "Entity";

    const hasSortOrderColumn = entityInfo?.columns?.some((column) => column.propertyName === "sortOrder");

    const hasStoreIdColumn = entityInfo?.columns?.some((column) => column.propertyName === "storeId");

    if (!(data as any).sortOrder && hasSortOrderColumn) {
      const whereCondition = this.sortOrderScope
        ? ({
            [this.sortOrderScope]: (data as any)[this.sortOrderScope],
          } as FindOptionsWhere<T>)
        : hasStoreIdColumn
          ? ({
              storeId: (data as any).storeId,
            } as FindOptionsWhere<T>)
          : undefined;
      (data as any).sortOrder = await this.getNextSortOrder(whereCondition, manager);
    }

    const hasCodeColumn = entityInfo?.columns?.some((column) => column.propertyName === "code");
    if (hasCodeColumn && !(data as any).code) {
      const code = await generateCode(entityName.toLocaleLowerCase());
      (data as any).code = code;
    }
    const entity = repo.create(data);
    const saved = await repo.save(entity);

    // Handle files after creation: move files from tempId to realId
    const tempId = (saved as any).tempId;
    const id = (saved as any).id;
    if (tempId && id) {
      await this.handleFilesOnCreate(id, tempId, saved, manager);
    }

    return saved;
  }

  /**
   * Create many
   */
  async createMany(data: DeepPartial<T>[], manager?: EntityManager, req?: RequestContext): Promise<T[]> {
    // Nạp thêm sortOrder và code nếu có
    const repo = this.getRepository(manager);
    const entityInfo = repo.metadata;
    const entityName = entityInfo?.name || "Entity";

    const hasSortOrderColumn = entityInfo?.columns?.some((column) => column.propertyName === "sortOrder");
    const hasCodeColumn = entityInfo?.columns?.some((column) => column.propertyName === "code");
    const hasStoreIdColumn = entityInfo?.columns?.some((column) => column.propertyName === "storeId");

    if (hasSortOrderColumn) {
      const whereCondition = this.sortOrderScope
        ? ({
            [this.sortOrderScope]: (data as any)[this.sortOrderScope],
          } as FindOptionsWhere<T>)
        : hasStoreIdColumn
          ? ({
              storeId: (data as any)[0]?.storeId,
            } as FindOptionsWhere<T>)
          : undefined;
      const newNextSortOrder = await this.getNextSortOrder(whereCondition, manager);

      data.forEach((item, index) => {
        if (!(item as any).sortOrder) {
          (item as any).sortOrder = newNextSortOrder + index * 10;
        }
      });
    }

    if (hasCodeColumn) {
      for (const item of data) {
        if (!(item as any).code) {
          (item as any).code = await generateCode(entityName);
        }
      }
    }

    const entities = repo.create(data as any[]);
    const saved = await repo.save(entities as any);
    return saved as T[];
  }

  async update(id: string, data: DeepPartial<T>, manager?: EntityManager, req?: RequestContext): Promise<T> {
    const repo = this.getRepository(manager);
    // Chỉ cập nhật các column của entity. Relation nested (ví dụ
    // Club.clubActivities) sẽ được xử lý ở service hook của module.
    const columnNames = new Set(repo.metadata.columns.map((column) => column.propertyName));
    const columnData = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(([key]) => columnNames.has(key)),
    );
    await repo.update(id, columnData as any);

    // Get updated entity để xử lý nested files
    const updatedEntity = await repo.findOne({
      where: { id } as any,
      relations: this.relations,
    });

    // Handle files after update: activate all files
    await this.handleFilesOnUpdate(id, manager, updatedEntity);

    const fullData = await this.findById(id, manager, req);

    // if (!fullData) {
    //   throw new NotFoundError("Không tìm thấy dữ liệu sau khi cập nhật");
    // }

    return fullData ? fullData : (updatedEntity as T);
  }

  async softDelete(id: string, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const res = await repo.softDelete(id);
    const result = (res.affected ?? 0) > 0;
    if (result) await this.handleFilesOnDelete(id, manager);
    return result;
  }

  async hardDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = this.getRepository(manager);
    await repo.delete(id);
    await this.handleFilesOnDelete(id, manager);
  }

  async deleteMany(ids: string[], manager?: EntityManager): Promise<boolean> {
    if (!ids || ids.length === 0) return true;

    const repo = this.getRepository(manager);
    const res = await repo.delete(ids);
    const affectedCount = res.affected ?? 0;
    for (const id of ids) {
      await this.handleFilesOnDelete(id, manager);
    }
    return affectedCount === ids.length;
  }

  /**
   * Soft delete many
   */
  async softDeleteMany(options: FindOptionsWhere<T>, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const dataToDelete = await repo.find({ where: options });

    for (const entity of dataToDelete) {
      await this.handleFilesOnDelete(entity.id, manager);
    }

    const result = await repo.softDelete(options);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Hard delete many
   */
  async hardDeleteMany(options: FindOptionsWhere<T>, manager?: EntityManager): Promise<boolean> {
    const repo = this.getRepository(manager);
    const dataToDelete = await repo.find({ where: options });

    for (const entity of dataToDelete) {
      await this.handleFilesOnDelete(entity.id, manager);
    }

    const result = await repo.delete(options);
    return (result.affected ?? 0) > 0;
  }

  async count(where?: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    const repo = this.getRepository(manager);
    return repo.count({ where });
  }

  async exists(where: FindOptionsWhere<T>, manager?: EntityManager): Promise<boolean> {
    const count = await this.count(where, manager);
    return count > 0;
  }

  async getNextSortOrder(where?: FindOptionsWhere<T>, manager?: EntityManager): Promise<number> {
    const maxSortOrderItem = await this.findByOption(
      {
        where,
        order: { sortOrder: "DESC" } as any,
      },
      manager,
    );

    return (maxSortOrderItem?.sortOrder || 0) + 10;
  }

  /**
   * Attach files to a single entity
   * Tự động gọi khi query entity
   * Hỗ trợ nested entities thông qua nestedFileFields
   */
  async attachFilesToEntity(entity: T & { id?: string }): Promise<T> {
    if (!entity || !entity.id) {
      return entity;
    }

    try {
      // Get File repository from store schema
      const fileRepo = this.getFileRepository();

      // Collect all entity IDs (root + nested)
      const collectedIds: string[] = [entity.id];

      // Helper function to get value from path (e.g., "lines.ingredient")
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current.map((item) => item?.[part]).filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      const finalNestedFileFields = [...(this.nestedFileFields || []), "creatorSnapshot", "updaterSnapshot"];

      // Collect nested entity IDs based on nestedFileFields
      if (finalNestedFileFields && finalNestedFileFields.length > 0) {
        for (const fieldPath of finalNestedFileFields) {
          const values = getValueByPath(entity, fieldPath);

          for (const item of values) {
            if (item && typeof item === "object" && item.id) {
              collectedIds.push(item.id);
            }
          }
        }
      }

      // Get files for all collected IDs
      const files = await fileRepo.find({
        where: {
          entityId: In(collectedIds),
          status: FileStatus.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of files) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = ((file as any).category || "uncategorized").toLowerCase();
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entity
      const entAny: any = { ...entity };
      if (entity.id && filesByEntity[entity.id]) {
        Object.assign(entAny, filesByEntity[entity.id]);
      }

      // Attach files to nested entities based on paths
      if (this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldPath of this.nestedFileFields) {
          const parts = fieldPath.split(".");
          let current: any = entAny;

          // Navigate to parent of target field
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) break;
            current = current[parts[i]];
          }

          const lastPart = parts[parts.length - 1];

          // Attach files to array items
          if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
              const item = current[i];
              if (!item) continue;

              const target = parts.length === 1 ? item : item[lastPart];

              if (Array.isArray(target)) {
                // Target is array
                item[lastPart] = target.map((subItem: any) => {
                  if (!subItem || !subItem.id) return subItem;
                  const childFiles = filesByEntity[subItem.id] || {};
                  return { ...subItem, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                item[lastPart] = { ...target, ...childFiles };
              } else if (parts.length === 1 && item.id) {
                // Direct array item
                const childFiles = filesByEntity[item.id] || {};
                current[i] = { ...item, ...childFiles };
              }
            }
          } else if (current[lastPart]) {
            // Handle nested field (array or single object)
            const target = current[lastPart];

            if (Array.isArray(target)) {
              // Target is array - attach files to each item
              current[lastPart] = target.map((item: any) => {
                if (!item || !item.id) return item;
                const childFiles = filesByEntity[item.id] || {};
                return { ...item, ...childFiles };
              });
            } else if (target && typeof target === "object" && target.id) {
              // Target is single object
              const childFiles = filesByEntity[target.id] || {};
              current[lastPart] = { ...target, ...childFiles };
            }
          }
        }
      }

      // Generate presigned URLs for S3 files
      await this.resolvePresignedUrls(entAny);

      return entAny as T;
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(`Failed to attach files to entity ${entity.id}:`, error);
      return entity;
    }
  }

  /**
   * Attach files to multiple entities
   * Tự động gọi khi query danh sách entities
   */
  async attachFilesToEntities(entities: (T & { id?: string })[]): Promise<T[]> {
    if (!entities || entities.length === 0) {
      return entities;
    }

    try {
      const collectedIds: string[] = [];

      // Helper function to get value from path
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current.map((item) => item?.[part]).filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      // Collect all entity IDs
      for (const e of entities) {
        if (e.id) collectedIds.push(e.id as string);

        // Collect nested IDs based on nestedFileFields
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const values = getValueByPath(e, fieldPath);

            for (const item of values) {
              if (item && typeof item === "object" && item.id) {
                collectedIds.push(item.id);
              }
            }
          }
        }
      }

      const uniqueIds = Array.from(new Set(collectedIds));
      if (uniqueIds.length === 0) return entities;

      // Get File repository from store schema
      const fileRepo = this.getFileRepository();
      const allFiles = await fileRepo.find({
        where: {
          entityId: In(uniqueIds),
          status: FileStatus.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });
      // if (allFiles.length > 0) {
      //   allFiles.slice(0, 5).forEach((f: any) => {});
      //   if (allFiles.length > 5) {
      //   }
      // }

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of allFiles) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = ((file as any).category || "uncategorized").toLowerCase();
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entities and nested entities
      const result = entities.map((entity) => {
        if (!entity.id) return entity;

        const entAny: any = { ...entity };

        // Attach files to root entity
        if (entity.id && filesByEntity[entity.id]) {
          Object.assign(entAny, filesByEntity[entity.id]);
        }

        // Attach files to nested entities based on paths
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const parts = fieldPath.split(".");
            let current: any = entAny;

            // Navigate to parent of target field
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) break;
              current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];

            // Attach files to array items
            if (Array.isArray(current)) {
              for (let i = 0; i < current.length; i++) {
                const item = current[i];
                if (!item) continue;

                const target = parts.length === 1 ? item : item[lastPart];

                if (Array.isArray(target)) {
                  // Target is array
                  item[lastPart] = target.map((subItem: any) => {
                    if (!subItem || !subItem.id) return subItem;
                    const childFiles = filesByEntity[subItem.id] || {};
                    return { ...subItem, ...childFiles };
                  });
                } else if (target && typeof target === "object" && target.id) {
                  // Target is single object
                  const childFiles = filesByEntity[target.id] || {};
                  item[lastPart] = { ...target, ...childFiles };
                } else if (parts.length === 1 && item.id) {
                  // Direct array item
                  const childFiles = filesByEntity[item.id] || {};
                  current[i] = { ...item, ...childFiles };
                }
              }
            } else if (current[lastPart]) {
              // Handle nested field (array or single object)
              const target = current[lastPart];

              if (Array.isArray(target)) {
                // Target is array - attach files to each item
                current[lastPart] = target.map((item: any) => {
                  if (!item || !item.id) return item;
                  const childFiles = filesByEntity[item.id] || {};
                  return { ...item, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                current[lastPart] = { ...target, ...childFiles };
              }
            }
          }
        }

        return entAny as T;
      });

      // Generate presigned URLs for S3 files (all entities)
      for (const e of result) {
        await this.resolvePresignedUrls(e as any);
      }

      return result;
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(`Failed to attach files to ${entities.length} entities:`, error);
      return entities;
    }
  }

  /**
   * Handle files after entity creation
   * Chuyển files từ tempId sang realId và active
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  async handleFilesOnCreate(
    entityId: string,
    tempId?: string,
    savedEntity?: any,
    manager?: EntityManager,
  ): Promise<void> {
    if (!tempId) return;

    try {
      const fileRepo = this.getFileRepository(manager);

      // Update files from tempId to realId and set status to ACTIVE
      const result = await fileRepo.update(
        {
          entityId: tempId,
        },
        {
          entityId: entityId,
          status: FileStatus.ACTIVE,
          expiresAt: null,
        },
      );
      logger.info(`Updated ${result.affected} files from tempId ${tempId} to entityId ${entityId}`);
      logger.info(`Updated files from tempId ${tempId} to entityId ${entityId}`);

      // Xử lý files cho nested entities (ví dụ: variants trong product)
      if (savedEntity && this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = savedEntity[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.tempId && nestedItem.id) {
                await fileRepo.update(
                  { entityId: tempId },
                  {
                    entityId,
                    status: FileStatus.ACTIVE,
                    expiresAt: null,
                  },
                );
                logger.info(`Updated files for nested ${fieldKey}: ${nestedItem.tempId} -> ${nestedItem.id}`);
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (nestedData && typeof nestedData === "object" && nestedData.tempId && nestedData.id) {
            await fileRepo.update(
              { entityId: tempId },
              {
                entityId,
                status: FileStatus.ACTIVE,
                expiresAt: null,
              },
            );
            logger.info(`Updated files for nested ${fieldKey}: ${nestedData.tempId} -> ${nestedData.id}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to handle files on create for entity ${entityId}:`, error);
    }
  }

  /**
   * Handle files after entity update
   * Activate all files linked to entity
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  async handleFilesOnUpdate(entityId: string, manager?: EntityManager, updatedEntity?: any): Promise<void> {
    try {
      const fileRepo = this.getFileRepository(manager);

      // Lấy danh sách pending files trước khi activate (để biết category nào có file mới)
      const pendingFiles = await fileRepo.find({
        where: {
          entityId: entityId,
          status: FileStatus.PENDING,
          deletedAt: null,
        } as any,
        order: { createdAt: "DESC" } as any,
      });

      // Activate tất cả pending files TRƯỚC
      await fileRepo
        .createQueryBuilder()
        .update()
        .set({
          status: FileStatus.ACTIVE,
          expiresAt: null,
        })
        .where("entityId = :entityId", { entityId })
        .andWhere("status = :status", { status: FileStatus.PENDING })
        .andWhere("deletedAt IS NULL")
        .execute();

      // Nếu không multipleFile: xóa các file ACTIVE cũ (giữ lại file vừa activate)
      if (!this.multipleFile && pendingFiles.length > 0) {
        const justActivatedIds = pendingFiles.map((f: any) => f.id);
        const categoriesWithNewFiles = [...new Set(pendingFiles.map((f: any) => f.category || "default"))];

        for (const category of categoriesWithNewFiles) {
          await fileRepo
            .createQueryBuilder()
            .softDelete()
            .where("entityId = :entityId", { entityId })
            .andWhere("category = :category", { category })
            .andWhere("status = :status", { status: FileStatus.ACTIVE })
            .andWhere("deletedAt IS NULL")
            .andWhere("id NOT IN (:...ids)", { ids: justActivatedIds })
            .execute();

          logger.info(`Soft-deleted old active files for category "${category}" (kept ${justActivatedIds.length} new)`);
        }
      }

      // Xử lý files cho nested entities (ví dụ: variants trong product)
      if (updatedEntity && this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = updatedEntity[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.id) {
                // ⚠️ Nested entities LUÔN chỉ giữ 1 file/category (single file mode)
                const pendingFiles = await fileRepo.find({
                  where: {
                    entityId: nestedItem.id,
                    status: FileStatus.PENDING,
                    deletedAt: null,
                  } as any,
                });

                const pendingByCategory: Record<string, any[]> = {};
                for (const file of pendingFiles) {
                  const category = (file as any).category || "default";
                  if (!pendingByCategory[category]) {
                    pendingByCategory[category] = [];
                  }
                  pendingByCategory[category].push(file);
                }

                // Xóa files cũ trước khi activate files mới
                for (const [category] of Object.entries(pendingByCategory)) {
                  await fileRepo
                    .createQueryBuilder()
                    .softDelete()
                    .where("entityId = :entityId", {
                      entityId: nestedItem.id,
                    })
                    .andWhere("category = :category", { category })
                    .andWhere("status = :status", {
                      status: FileStatus.ACTIVE,
                    })
                    .andWhere("deletedAt IS NULL")
                    .execute();
                }

                // Activate pending files
                await fileRepo
                  .createQueryBuilder()
                  .update()
                  .set({
                    status: FileStatus.ACTIVE,
                    expiresAt: null,
                  })
                  .where("entityId = :entityId", { entityId: nestedItem.id })
                  .andWhere("status = :status", {
                    status: FileStatus.PENDING,
                  })
                  .andWhere("deletedAt IS NULL")
                  .execute();
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (nestedData && typeof nestedData === "object" && nestedData.id) {
            // ⚠️ Nested entities LUÔN chỉ giữ 1 file/category (single file mode)
            const pendingFiles = await fileRepo.find({
              where: {
                entityId: nestedData.id,
                status: FileStatus.PENDING,
                deletedAt: null,
              } as any,
            });

            const pendingByCategory: Record<string, any[]> = {};
            for (const file of pendingFiles) {
              const category = (file as any).category || "default";
              if (!pendingByCategory[category]) {
                pendingByCategory[category] = [];
              }
              pendingByCategory[category].push(file);
            }

            // Xóa files cũ trước khi activate files mới
            for (const [category] of Object.entries(pendingByCategory)) {
              await fileRepo
                .createQueryBuilder()
                .softDelete()
                .where("entityId = :entityId", { entityId: nestedData.id })
                .andWhere("category = :category", { category })
                .andWhere("status = :status", {
                  status: FileStatus.ACTIVE,
                })
                .andWhere("deletedAt IS NULL")
                .execute();
            }

            // Activate pending files
            await fileRepo
              .createQueryBuilder()
              .update()
              .set({
                status: FileStatus.ACTIVE,
                expiresAt: null,
              })
              .where("entityId = :entityId", { entityId: nestedData.id })
              .andWhere("status = :status", { status: FileStatus.PENDING })
              .andWhere("deletedAt IS NULL")
              .execute();
          }
        }
      }
    } catch (error) {
      logger.error(`Failed to handle files on update for entity ${entityId}:`, error);
    }
  }

  /**
   * Handle files after entity deletion
   * Delete all files linked to entity (DB + physical storage)
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  protected async handleFilesOnDelete(entityId: string, manager?: EntityManager): Promise<void> {
    try {
      const fileRepo = this.getFileRepository(manager);

      // Get entity với relations để lấy nested entities
      const repo = this.getRepository(manager);

      const entity = await repo.findOne({
        where: { id: entityId } as any,
        relations: this.relations,
      });

      // Collect tất cả entityIds cần xóa files (entity chính + nested entities)
      const entityIdsToDelete: string[] = [entityId];

      // Thu thập IDs của nested entities
      if (entity && this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = (entity as any)[fieldKey];

          // Kiểm tra nếu là array
          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.id) {
                entityIdsToDelete.push(nestedItem.id);
              }
            }
          }
          // Kiểm tra nếu là object đơn
          else if (nestedData && typeof nestedData === "object" && nestedData.id) {
            entityIdsToDelete.push(nestedData.id);
          }
        }
      }

      // Get all files linked to entity và nested entities
      const files = await fileRepo.find({
        where: {
          entityId: In(entityIdsToDelete),
        } as any,
      });

      // Delete physical files
      for (const file of files) {
        try {
          const filePath = (file as any).path;
          const thumbnailPath = (file as any).thumbnailPath;

          if (filePath) {
            await fs.unlink(filePath).catch(() => {
              // File might not exist, ignore error
            });
          }

          if (thumbnailPath) {
            await fs.unlink(thumbnailPath).catch(() => {
              // Thumbnail might not exist, ignore error
            });
          }
        } catch (error) {
          logger.warn(`Failed to delete physical file ${(file as any).path}:`, error);
        }
      }

      // Delete files from database
      await fileRepo.delete({
        entityId: In(entityIdsToDelete),
      } as any);

      logger.info(`Deleted ${files.length} files for entity ${entityId} and nested entities`);
    } catch (error) {
      logger.error(`Failed to handle files on delete for entity ${entityId}:`, error);
    }
  }

  checkArrayFilter(value?: any): boolean {
    return value && Array.isArray(value) && value.length > 0;
  }

  /**
   * Convert S3 storageKey → presigned URL cho tất cả file đã upload lên S3.
   * Gọi sau khi attach files vào entity.
   * Xử lý cả storageKey và thumbnailStorageKey.
   */
  private async resolvePresignedUrls(entity: any): Promise<void> {
    try {
      // Duyệt tất cả properties tìm file arrays (theo category)
      const categoryKeys = Object.keys(entity).filter(
        (k) => Array.isArray(entity[k]) && entity[k].length > 0 && entity[k][0]?.storageKey,
      );

      for (const catKey of categoryKeys) {
        const files = entity[catKey] as any[];
        for (const file of files) {
          // Resolve main file presigned URL
          if (file.isUploadedToS3 && file.storageKey) {
            const { getPresignedUrl } = await import("../utils/s3Helper.js");
            const presignedUrl = await getPresignedUrl(file.storageKey);
            if (presignedUrl) {
              file.url = presignedUrl;
            }
          }

          // Resolve thumbnail presigned URL
          if (file.isUploadedToS3 && file.thumbnailStorageKey) {
            const { getPresignedUrl: getThumbPresignedUrl } = await import("../utils/s3Helper.js");
            const thumbPresignedUrl = await getThumbPresignedUrl(file.thumbnailStorageKey);
            if (thumbPresignedUrl) {
              file.thumbnailUrl = thumbPresignedUrl;
            }
          }
        }
      }
    } catch {
      // Silent fail — presigned URL is optional
    }
  }

  private getFileRepository(manager?: EntityManager) {
    return manager ? manager.getRepository("FileEntity") : this.dataSource.getRepository("FileEntity");
  }
}
