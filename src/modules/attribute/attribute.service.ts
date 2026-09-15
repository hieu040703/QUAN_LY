import { injectable, inject } from "inversify";
import { BaseService } from "@/shared/base/BaseService";
import { AttributeRepository } from "./attribute.repository";
import { ATTRIBUTE_TYPES } from "./attribute.types";
import { Attribute, AttributeTypeEnum } from "@/database/models/Attribute";

/**
 * Attribute Service -  Entity
 * Tất cả methods cần tenantCode
 */
@injectable()
export class AttributeService extends BaseService<Attribute> {
  protected repository: AttributeRepository;
  protected uniqueFields: (keyof Attribute)[] = ["code", "name"];
  protected uniqueScope: (keyof Attribute)[] = ["type"];
  protected searchableFields = ["code", "name", "note"];

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeRepository)
    repository: AttributeRepository,
  ) {
    super();
    this.repository = repository;
  }

  /**
   * Find attributes by type
   */
  async findByType(type: AttributeTypeEnum): Promise<Attribute[]> {
    return this.repository.findByType(type);
  }
}
