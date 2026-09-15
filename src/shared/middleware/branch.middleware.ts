import { Request, Response, NextFunction } from "express";

export const branchMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method !== "POST" || !req.body?.branchId) {
    return next();
  }

  const branchId = req.body.branchId;

  if (req.body.members && Array.isArray(req.body.members)) {
    req.body.members = req.body.members.map((member: any) => {
      if (!member.branchId) {
        return { ...member, branchId };
      }
      return member;
    });
  }

  if (req.body.lines && Array.isArray(req.body.lines)) {
    req.body.lines = req.body.lines.map((line: any) => {
      if (!line.branchId) {
        return { ...line, branchId };
      }
      return line;
    });
  }

  next();
};
