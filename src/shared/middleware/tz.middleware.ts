import { Request, Response, NextFunction } from "express";
import dayjs from "dayjs";

export function normalizeDateRangeMiddleware(
  keys: { start?: string; end?: string } = { start: "startAt", end: "endAt" },
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const tz = (req.headers[`x-timezone`] as string) || "UTC";
    const { start, end } = keys;

    if (start && req.query[start]) {
      req.query[start] = dayjs
        .tz(req.query[start] as string, "YYYY-MM-DD", tz) // parse theo date + tz
        .startOf("day")
        .utc()
        .toISOString();
    }

    if (end && req.query[end]) {
      req.query[end] = dayjs
        .tz(req.query[end] as string, "YYYY-MM-DD", tz) // parse theo date + tz
        .endOf("day")
        .utc()
        .toISOString();
    }

    next();
  };
}

// Nạp tz vào query
export function tzMiddleware(req: Request, _res: Response, next: NextFunction) {
  const tz = (req.headers[`x-timezone`] as string) || "UTC";
  req.query.tz = tz;
  next();
}
