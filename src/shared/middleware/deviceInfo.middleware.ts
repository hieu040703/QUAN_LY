import { Request, Response, NextFunction } from "express";

export function deviceInfoMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const headers = req.headers;

  const deviceId = headers["x-device-id"] as string;
  const ipFromFE = headers["x-ip-address"] as string;
  const browser = headers["sec-ch-ua"] as string;
  const os = headers["sec-ch-ua-platform"] as string;

  const deviceInfo = {
    id: deviceId,
    userAgent: headers["user-agent"] || "",
    browser,
    ip: ipFromFE,
    os,
  };

  (req as any).deviceInfo = deviceInfo;

  next();
}
