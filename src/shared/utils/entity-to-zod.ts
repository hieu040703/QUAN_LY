import { z } from "zod";
import "reflect-metadata";
import { getMetadataArgsStorage } from "typeorm";

/**
 * Utility để tự động tạo Zod schema từ TypeORM Entity
 */

// Mapping TypeORM types to Zod types
const typeMapping: Record<string, () => z.ZodTypeAny> = {
  // Numbers
  int: () => z.number().int(),
  integer: () => z.number().int(),
  tinyint: () => z.number().int(),
  smallint: () => z.number().int(),
  mediumint: () => z.number().int(),
  bigint: () => z.number().int(),
  decimal: () => z.number(),
  numeric: () => z.number(),
  float: () => z.number(),
  double: () => z.number(),
  real: () => z.number(),

  // Strings
  varchar: () => z.string().trim(),
  char: () => z.string().trim(),
  text: () => z.string().trim(),
  tinytext: () => z.string().trim(),
  mediumtext: () => z.string().trim(),
  longtext: () => z.string().trim(),
  string: () => z.string().trim(),

  // Dates
  date: () => z.date(),
  datetime: () => z.date(),
  timestamp: () => z.date(),
  time: () => z.string().trim(), // Time as string

  // Boolean
  boolean: () => z.boolean(),
  bool: () => z.boolean(),

  // JSON
  json: () => z.record(z.string().trim(), z.unknown()),
  jsonb: () => z.record(z.string().trim(), z.unknown()),
};

interface ColumnInfo {
  propertyName: string;
  type: string;
  isNullable?: boolean;
  isGenerated?: boolean | string;
  length?: number | string;
  options?: any;
}

/**
 * Trích xuất thông tin column từ Entity
 */
export function extractEntityColumns(entityClass: Function): ColumnInfo[] {
  const metadata = getMetadataArgsStorage();
  const columns: ColumnInfo[] = [];

  // Lấy column metadata
  const columnMetadata = metadata.columns.filter(
    (column) => column.target === entityClass,
  );

  for (const column of columnMetadata) {
    const columnInfo: ColumnInfo = {
      propertyName: column.propertyName,
      type:
        typeof column.options.type === "string"
          ? column.options.type
          : column.options.type?.name?.toLowerCase() || "string",
      isNullable: column.options.nullable,
      isGenerated: column.options.generated,
      length: column.options.length,
      options: column.options,
    };

    columns.push(columnInfo);
  }

  return columns;
}

/**
 * Tạo Zod schema từ Entity class
 */
export function createZodSchemaFromEntity(
  entityClass: Function,
  options: {
    exclude?: string[];
    optional?: string[];
    include?: string[];
    customValidations?: Record<string, z.ZodTypeAny>;
  } = {},
): z.ZodObject<any> {
  const {
    exclude = [],
    optional = [],
    include,
    customValidations = {},
  } = options;

  const columns = extractEntityColumns(entityClass);
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  for (const column of columns) {
    const { propertyName, type, isNullable, isGenerated } = column;

    // Skip excluded fields
    if (exclude.includes(propertyName)) continue;

    // If include is specified, only include those fields
    if (include && !include.includes(propertyName)) continue;

    // Skip generated fields (like id, created_at, updated_at)
    if (isGenerated && !include?.includes(propertyName)) continue;

    // Use custom validation if provided
    if (customValidations[propertyName]) {
      schemaFields[propertyName] = customValidations[propertyName];
      continue;
    }

    // Get Zod type from mapping
    const zodTypeFactory = typeMapping[type.toLowerCase()];
    if (!zodTypeFactory) {
      console.warn(
        `Unknown type ${type} for property ${propertyName}, using string`,
      );
      schemaFields[propertyName] = z.string().trim();
      continue;
    }

    let zodType = zodTypeFactory();

    // Make optional if specified or nullable
    if (optional.includes(propertyName) || isNullable) {
      zodType = zodType.optional();
    }

    schemaFields[propertyName] = zodType;
  }

  return z.object(schemaFields);
}

/**
 * Tạo Create schema (exclude id, timestamps)
 */
export function createCreateSchema<T extends Function>(
  entityClass: T,
  customOptions: {
    exclude?: string[];
    optional?: string[];
    customValidations?: Record<string, z.ZodTypeAny>;
  } = {},
): z.ZodObject<any> {
  const defaultExclude = ["id", "createdAt", "updatedAt", "deletedAt"];
  const exclude = [...defaultExclude, ...(customOptions.exclude || [])];

  return createZodSchemaFromEntity(entityClass, {
    ...customOptions,
    exclude,
  });
}

/**
 * Tạo Update schema (tất cả fields optional)
 */
export function createUpdateSchema<T extends Function>(
  entityClass: T,
  customOptions: {
    exclude?: string[];
    customValidations?: Record<string, z.ZodTypeAny>;
  } = {},
): z.ZodObject<any> {
  const defaultExclude = ["id", "createdAt", "updatedAt", "deletedAt"];
  const exclude = [...defaultExclude, ...(customOptions.exclude || [])];

  const columns = extractEntityColumns(entityClass);
  const optional = columns
    .filter((col) => !exclude.includes(col.propertyName))
    .map((col) => col.propertyName);

  return createZodSchemaFromEntity(entityClass, {
    ...customOptions,
    exclude,
    optional,
  });
}

/**
 * Tạo Query schema với pagination và search
 */
export function createQuerySchema(
  searchFields: string[] = ["keyword"],
): z.ZodObject<any> {
  const baseSchema: Record<string, z.ZodTypeAny> = {
    page: z
      .string()
      .transform((val) => parseInt(val) || 1)
      .optional(),
    size: z
      .string()
      .transform((val) => parseInt(val) || 10)
      .optional(),
  };

  // Add search fields
  for (const field of searchFields) {
    baseSchema[field] = z.string().trim().optional();
  }

  return z.object(baseSchema);
}

/**
 * Tạo Params schema cho ID
 */
export function createParamsSchema(
  idField: string = "id",
  customValidation?: z.ZodTypeAny,
): z.ZodObject<any> {
  const validation =
    customValidation || z.coerce.number().positive(`Invalid ${idField} format`);

  return z.object({
    [idField]: validation,
  });
}
