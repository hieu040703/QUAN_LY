import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@/shared/types/errors";

type ValidationSource = "body" | "query" | "params";

export function zodValidate(schema: ZodSchema, source: ValidationSource = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        const errors = issues.map((e: any) => ({
          field: e.path?.join(".") || "",
          code: "INVALID_INPUT",
          message: e.message,
        }));
        next(new ValidationError("Dữ liệu không hợp lệ", errors));
      } else {
        next(error);
      }
    }
  };
}
