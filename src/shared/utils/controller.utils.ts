import { Request, Response, NextFunction } from "express";
import { IError } from "@/shared/types/interfaces";

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

interface ApiResponse<T = any> {
  res: Response;
  data?: T | null;
  message?: string;
  statusCode?: number;
}

export const sendResponse = <T>({ res, data = null, message = "Success", statusCode = 200 }: ApiResponse<T>): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

interface ApiErrorResponse {
  res: Response;
  message?: string;
  statusCode?: number;
  errors?: IError[];
}

export const sendError = ({ res, message = "Error", statusCode = 500, errors = [] }: ApiErrorResponse): void => {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};
