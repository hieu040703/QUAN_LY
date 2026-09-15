import { Request, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { ValidationError } from "../types/errors";
import DatabaseConfig from "@/config/database";
import logger from "./logger";
import { User } from "@/database/models/User";
import dayjs from "dayjs";
import { Attribute } from "@/database/models/Attribute";
import { Booking } from "@/database/models/Booking";
import { Club } from "@/database/models/Club";

type ResetPeriod = "none" | "yearly" | "monthly";

type CodeConfig = {
  entity: EntityTarget<ObjectLiteral>;
  prefix: string;
  length: number;
  resetPeriod: ResetPeriod;
};

const codeConfig: Record<string, CodeConfig> = {
  user: { entity: User, prefix: "FC", length: 4, resetPeriod: "none" },
  attribute: {
    entity: Attribute,
    length: 5,
    prefix: "AT",
    resetPeriod: "none",
  },
  checkin: {
    entity: Attribute,
    length: 5,
    prefix: "CI",
    resetPeriod: "monthly",
  },
  booking: {
    entity: Booking,
    length: 5,
    prefix: "BK",
    resetPeriod: "monthly",
  },
  club: {
    entity: Club,
    length: 5,
    prefix: "CLB",
    resetPeriod: "none",
  },
};

function getPeriodInfo(period: ResetPeriod = "none") {
  const now = dayjs().tz();

  const yy = now.format("YY");
  const mm = now.format("MM");

  switch (period) {
    case "yearly":
      return {
        periodKey: yy,
        codePrefix: yy,
      };

    case "monthly":
      return {
        periodKey: `${yy}${mm}`,
        codePrefix: `${yy}${mm}`,
      };

    default:
      return {
        periodKey: "global",
        codePrefix: "",
      };
  }
}

export const getEntityByType = (type: string): EntityTarget<ObjectLiteral> | undefined => {
  const normalized = type.toLowerCase();
  return codeConfig[normalized]?.entity;
};

function getConfig(type: string): CodeConfig {
  const normalized = type.toLowerCase();

  const config = codeConfig[normalized];

  if (!config) {
    throw new ValidationError("Không tìm thấy cấu hình cho loại mã này");
  }

  return config;
}

async function getNextSequence(key: string, periodKey: string): Promise<number> {
  const seqName = `code_seq_${key}_${periodKey}`
    .replace(/\./g, "_")
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");

  await DatabaseConfig.query(`
    CREATE SEQUENCE IF NOT EXISTS "${seqName}"
    START 1;
  `);

  const result = await DatabaseConfig.query(`
    SELECT nextval('"${seqName}"') as value;
  `);

  return Number(result[0].value);
}

export const generateCode = async (type: string): Promise<string> => {
  try {
    const { prefix, length, resetPeriod = "none" } = getConfig(type);

    const key = type.toLowerCase();

    const { periodKey, codePrefix } = getPeriodInfo(resetPeriod);

    const nextNumber = await getNextSequence(key, periodKey);

    const runningCode = String(nextNumber).padStart(length, "0");

    switch (resetPeriod) {
      case "yearly":
      case "monthly":
        return `${prefix}-${codePrefix}-${runningCode}`;

      default:
        return `${prefix}-${runningCode}`;
    }
  } catch (error) {
    logger.error("Code generation error:", error);
    throw error;
  }
};

export async function getCode(req: Request, res: Response) {
  try {
    const type = req.query.type as string;

    if (!type) {
      return res.status(400).json({
        message: "type.required",
        errors: [
          {
            field: "type",
            message: "Loại mã là bắt buộc",
          },
        ],
      });
    }

    const code = await generateCode(type);

    return res.json({
      statusCode: 200,
      data: { code },
      success: true,
      message: "code.generated",
    });
  } catch (error) {
    logger.error("Get code error:", error);
    return res.status(500).json({
      message: (error as any).message || "server.error",
      errors: (error as any).errors || [],
    });
  }
}

export function alphaNumericToNumber(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => {
      if (/[A-Z]/.test(c)) return (c.charCodeAt(0) - 64).toString();
      return c;
    })
    .join("");
}
