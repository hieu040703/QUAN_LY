import { z } from "zod";
import { IdentificationTypeEnum } from "../constants/enum";
export const DateTransform = z.coerce.date();

const TRUE_VALUES = ["true", "1", "yes", "y", "x", "có", "co", "on"];

const FALSE_VALUES = ["false", "0", "no", "n", "off", "không", "khong"];

export const zBooleanLike = (defaultValue?: boolean) => {
  const schema = z.preprocess((val) => {
    // boolean
    if (typeof val === "boolean") return val;

    // number
    if (typeof val === "number") {
      return val !== 0;
    }

    // string
    if (typeof val === "string") {
      const lower = val.toLowerCase().trim();

      if (TRUE_VALUES.includes(lower)) return true;

      if (FALSE_VALUES.includes(lower)) return false;
    }

    return val;
  }, z.boolean());

  return defaultValue !== undefined ? schema.optional().default(defaultValue) : schema.optional();
};

/**
 * Cho phép:
 * - 1 giá trị
 * - hoặc mảng giá trị
 * => luôn transform thành array
 */
export const zArrayable = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .union([schema, z.array(schema)])
    .optional()
    .transform((val) => {
      if (val == null) return undefined;
      return Array.isArray(val) ? val : [val];
    });

export function withSortOrder<T>(items?: T[]):
  | (T & {
      sortOrder: number;
    })[]
  | undefined {
  if (!items) return items;

  return items.map((item, index) => ({
    ...item,
    sortOrder: 10 + index * 10,
  }));
}

export const BaseCodeSchema = z.string().trim().trim().nonempty().max(50);

export const BaseNullableUuidSchema = z.preprocess((val) => (val === "null" ? null : val), z.uuid().nullish());

export const zEnumFromTsEnum = <T extends Record<string, string | number>>(enumObj: T) =>
  z.enum(Object.values(enumObj) as [string, ...string[]]);

export const BaseCreateSchema = z.object({
  tempId: z.uuid().nullish(),
  note: z.string().trim().trim().nullish(),
  isDefault: z.boolean().optional(),
  creatorId: z.uuid().nullish(),
  creator: z.any().nullish(),
  sortOrder: z.number().optional(),
  employeeId: z.uuid().optional(),
  userId: z.uuid().optional(),
});

export const BaseUpdateSchema = z.object({
  note: z.string().trim().trim().nullish(),
  updaterId: z.uuid().nullish(),
  updater: z.any().nullish(),
  sortOrder: z.number().optional(),
});

export const BaseNumberQuerySchema = z.coerce.number().optional();

export const BaseQuerySchema = z.object({
  page: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  keyword: z.string().trim().trim().optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
  offsetAt: DateTransform.optional(),
  type: z.string().trim().trim().optional(),
  status: z.string().trim().trim().optional(),
  sortBy: z.string().trim().trim().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  isFinished: zBooleanLike(),
  isActive: zBooleanLike(),
  warehouseId: z.uuid().optional(),
  warehouseIds: zArrayable(z.uuid()),
  branchId: z.uuid().optional(),
  branchIds: zArrayable(z.uuid()),
  companyId: z.uuid().optional(),
  employeeId: z.uuid().optional(),
  userId: z.uuid().optional(),
  clubId: z.uuid().optional(),

  // Common array ID filters
  ids: zArrayable(z.uuid()),
  notIds: zArrayable(z.uuid()),
  clubIds: zArrayable(z.uuid()),

  creatorIds: zArrayable(z.uuid()),
  updaterIds: zArrayable(z.uuid()),

  companyIds: zArrayable(z.uuid()),
  userIds: zArrayable(z.uuid()),
  partnerIds: zArrayable(z.uuid()),
  categoryIds: zArrayable(z.uuid()),
  orderIds: zArrayable(z.uuid()),
  partnerGroupIds: zArrayable(z.uuid()),
  productGroupIds: zArrayable(z.uuid()),
  customerIds: zArrayable(z.uuid()),
  supplierIds: zArrayable(z.uuid()),
  shipperIds: zArrayable(z.uuid()),
  unitIds: zArrayable(z.uuid()),
  fundIds: zArrayable(z.uuid()),
  productIds: zArrayable(z.uuid()),
  employeeIds: zArrayable(z.uuid()),
  workOrderIds: zArrayable(z.uuid()),
  machineIds: zArrayable(z.uuid()),

  totalQuantityGte: BaseNumberQuerySchema,
  totalQuantityLte: BaseNumberQuerySchema,
  totalQuantityGt: BaseNumberQuerySchema,
  totalQuantityLt: BaseNumberQuerySchema,
  totalQuantityEq: BaseNumberQuerySchema,

  totalAmountGte: BaseNumberQuerySchema,
  totalAmountLte: BaseNumberQuerySchema,
  totalAmountGt: BaseNumberQuerySchema,
  totalAmountLt: BaseNumberQuerySchema,
  totalAmountEq: BaseNumberQuerySchema,

  totalAdjustmentQuantityGte: BaseNumberQuerySchema,
  totalAdjustmentQuantityLte: BaseNumberQuerySchema,
  totalAdjustmentQuantityGt: BaseNumberQuerySchema,
  totalAdjustmentQuantityLt: BaseNumberQuerySchema,
  totalAdjustmentQuantityEq: BaseNumberQuerySchema,

  totalAdjustmentAmountGte: BaseNumberQuerySchema,
  totalAdjustmentAmountLte: BaseNumberQuerySchema,
  totalAdjustmentAmountGt: BaseNumberQuerySchema,
  totalAdjustmentAmountLt: BaseNumberQuerySchema,
  totalAdjustmentAmountEq: BaseNumberQuerySchema,

  totalTransferQuantityGte: BaseNumberQuerySchema,
  totalTransferQuantityLte: BaseNumberQuerySchema,
  totalTransferQuantityGt: BaseNumberQuerySchema,
  totalTransferQuantityLt: BaseNumberQuerySchema,
  totalTransferQuantityEq: BaseNumberQuerySchema,

  totalTransferAmountGte: BaseNumberQuerySchema,
  totalTransferAmountLte: BaseNumberQuerySchema,
  totalTransferAmountGt: BaseNumberQuerySchema,
  totalTransferAmountLt: BaseNumberQuerySchema,
  totalTransferAmountEq: BaseNumberQuerySchema,

  costPriceGte: BaseNumberQuerySchema,
  costPriceLte: BaseNumberQuerySchema,
  costPriceGt: BaseNumberQuerySchema,
  costPriceLt: BaseNumberQuerySchema,
  costPriceEq: BaseNumberQuerySchema,

  priceGte: BaseNumberQuerySchema,
  priceLte: BaseNumberQuerySchema,
  priceGt: BaseNumberQuerySchema,
  priceLt: BaseNumberQuerySchema,
  priceEq: BaseNumberQuerySchema,

  taxRateGte: BaseNumberQuerySchema,
  taxRateLte: BaseNumberQuerySchema,
  taxRateGt: BaseNumberQuerySchema,
  taxRateLt: BaseNumberQuerySchema,
  taxRateEq: BaseNumberQuerySchema,

  totalStockQuantityGte: BaseNumberQuerySchema,
  totalStockQuantityLte: BaseNumberQuerySchema,
  totalStockQuantityGt: BaseNumberQuerySchema,
  totalStockQuantityLt: BaseNumberQuerySchema,
  totalStockQuantityEq: BaseNumberQuerySchema,

  totalStockValueGte: BaseNumberQuerySchema,
  totalStockValueLte: BaseNumberQuerySchema,
  totalStockValueGt: BaseNumberQuerySchema,
  totalStockValueLt: BaseNumberQuerySchema,
  totalStockValueEq: BaseNumberQuerySchema,

  quantityGte: BaseNumberQuerySchema,
  quantityLte: BaseNumberQuerySchema,
  quantityGt: BaseNumberQuerySchema,
  quantityLt: BaseNumberQuerySchema,
  quantityEq: BaseNumberQuerySchema,

  totalMinStockGte: BaseNumberQuerySchema,
  totalMinStockLte: BaseNumberQuerySchema,
  totalMinStockGt: BaseNumberQuerySchema,
  totalMinStockLt: BaseNumberQuerySchema,
  totalMinStockEq: BaseNumberQuerySchema,

  deltaAmountGte: BaseNumberQuerySchema,
  deltaAmountLte: BaseNumberQuerySchema,
  deltaAmountGt: BaseNumberQuerySchema,
  deltaAmountLt: BaseNumberQuerySchema,
  deltaAmountEq: BaseNumberQuerySchema,
});
export type BaseQueryDto = z.infer<typeof BaseQuerySchema>;

export const BaseSortOrderSchema = z.object({
  sortOrder: z.coerce.number(),
});
export type BaseSortOrderDto = z.infer<typeof BaseSortOrderSchema>;

export const BaseDeleteManySchema = z.object({
  ids: z.array(z.uuid()).min(1),
});
export type BaseDeleteManyDto = z.infer<typeof BaseDeleteManySchema>;

export const BaseParamsSchema = z.object({
  id: z.uuid(),
});
export type BaseParamsDto = z.infer<typeof BaseParamsSchema>;

export const AddressSchema = z.object({
  state: z.string().trim().trim().optional(),
  ward: z.string().trim().trim().optional(),
  detail: z.string().trim().trim().nullish(),
  lng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

export const InsuranceInfoSchema = z.object({
  salary: z.coerce.number().optional(), // Lương đóng bảo hiểm
  startDate: DateTransform.optional(), // Ngày bắt đầu đóng bảo hiểm
  rate: z.coerce.number().optional(), // Tỷ lệ đóng bảo hiểm (phần trăm)
  insuranceNumber: z.string().trim().trim().optional(), // Số sổ bảo hiểm
});
export type InsuranceInfo = z.infer<typeof InsuranceInfoSchema>;

export const IdentificationSchema = z.object({
  type: z.enum(IdentificationTypeEnum).optional().default(IdentificationTypeEnum.CCCD), // Loại giấy tờ (CCCD, CMND, HC)
  identityCode: z.string().trim().trim().optional(), // Số CMND/CCCD
  issuedPlace: z.string().trim().trim().optional(), // Nơi cấp CMND/CCCD
  issuedDate: DateTransform.optional(), // Ngày cấp CMND/CCCD
  expiredDate: DateTransform.optional(), // Ngày hết hạn CMND/CCCD
});
export type Identification = z.infer<typeof IdentificationSchema>;

export const EducationInfoSchema = z.object({
  educationLevel: z.string().trim().trim().optional(), // Trình độ văn hóa học vấn (12/12)
  trainingLevel: z.string().trim().trim().optional(), // Trình độ đào tạo (Cao đẳng, Đại học, Thạc sĩ, Tiến sĩ)
  institution: z.string().trim().trim().optional(), // Nơi đào tạo (Trường Đại học ABC)
  faculty: z.string().trim().trim().optional(), // Khoa đào tạo (Khoa Công nghệ thông tin)
  major: z.string().trim().trim().optional(), // Chuyên ngành đào tạo (Công nghệ phần mềm)
  graduationYear: z.coerce.number().optional(), // Năm tốt nghiệp
});
export type EducationInfo = z.infer<typeof EducationInfoSchema>;

export const SettingSchema = z.object({
  region: z
    .object({
      country: z.string().trim().trim().nullish(),
      language: z.string().trim().trim().nullish(),
      timezone: z.string().trim().trim().nullish(),
    })
    .optional(),
  dateFormat: z
    .object({
      date: z.string().trim().trim().nullish(),
      time: z.string().trim().trim().nullish(),
      displayTime: z.string().trim().trim().nullish(),
    })
    .optional(),
  numberFormat: z
    .object({
      decimal: z.string().trim().trim().nullish(),
      thousand: z.string().trim().trim().nullish(),
      fraction: z.string().trim().trim().nullish(),
    })
    .optional(),
  currencyFormat: z
    .object({
      symbol: z.string().trim().trim().nullish(),
      fraction: z.string().trim().trim().nullish(),
      position: z.enum(["before", "after"]).optional(),
    })
    .optional(),
});
export type Setting = z.infer<typeof SettingSchema>;

export const BankAccountSchema = z.object({
  bankName: z.string().trim().trim().nullish(),
  accountNumber: z.string().trim().trim().nullish(),
  accountHolder: z.string().trim().trim().nullish(),
  branch: z.string().trim().trim().nullish(),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

export const CitizenIdentificationSchema = z.object({
  id: z.string().trim().trim(),
  name: z.string().trim().trim(),
  dob: z.date().nullish(),
  gender: z.string().trim().trim().nullish(),
  issuedDate: z.date().nullish(),
  expirationDate: z.date().nullish(),
  placeOfIssue: z.string().trim().trim().nullish(),
  issuedBy: z.string().trim().trim().nullish(),
  files: z.array(z.string().trim().trim()).optional().default([]),
});
export type CitizenIdentification = z.infer<typeof CitizenIdentificationSchema>;

export const RepresentativeSchema = z.object({
  name: z.string().trim().trim().nullish(),
  position: z.string().trim().trim().nullish(),
  relativetionship: z.string().trim().trim().nullish(),
  phone: z.string().trim().trim().nullish(),
  email: z.string().trim().trim().nullish(),
});
export type Representative = z.infer<typeof RepresentativeSchema>;

export const TimeFrameSchema = z.object({
  start: z.string().trim().trim().optional(),
  end: z.string().trim().trim().optional(),
});
export type TimeFrame = z.infer<typeof TimeFrameSchema>;

export const CompensationSchema = z.object({
  name: z.string().trim().trim(),
  amount: z.number().optional(),
  note: z.string().trim().trim().nullish(),
});
export type Compensation = z.infer<typeof CompensationSchema>;

export const AdditionalInfoSchema = z.object({
  label: z.string().trim().trim().optional(),
  value: z.string().trim().trim().optional(),
});
export type AdditionalInfo = z.infer<typeof AdditionalInfoSchema>;
