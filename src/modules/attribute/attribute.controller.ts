import { injectable, inject } from "inversify";
import { AttributeService } from "./attribute.service";
import { ATTRIBUTE_TYPES } from "./attribute.types";
import { BaseController } from "@/shared/base/BaseController";
import { NextFunction, Request, Response } from "express";
import { Attribute } from "@/database/models/Attribute";
import { AttributeQueryDto } from "./attribute.validator";

/**
 * Attribute Controller -  Entity
 */
@injectable()
export class AttributeController extends BaseController<Attribute> {
  protected service: AttributeService;

  constructor(
    @inject(ATTRIBUTE_TYPES.AttributeService)
    attributeService: AttributeService,
  ) {
    super();
    this.service = attributeService;
  }

  /**
   * GET /by-type/:type
   * Get attributes by type
   */
  getByType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.query as unknown as AttributeQueryDto;

      const data = await this.service.findByType(type);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
