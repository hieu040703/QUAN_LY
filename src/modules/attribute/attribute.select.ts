import { Attribute } from "@/database/models/Attribute";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsRelations, FindOptionsSelect } from "typeorm";

export const AttributeSelectBasic: FindOptionsSelect<Attribute> = {
  ...BaseSelect,
  name: true,
  type: true,
};

export const AttributeSelectFull: FindOptionsSelect<Attribute> = {
  ...AttributeSelectBasic,
};

export const AttributeRelations: FindOptionsRelations<Attribute> = {};
