export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public errors?: unknown[];

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", errors?: unknown[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", field?: string) {
    const errors = field ? [{ field, code: "UNAUTHORIZED", message }] : undefined;
    super(message, 401, "UNAUTHORIZED", errors);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", field?: string) {
    const errors = field ? [{ field, code: "BAD_REQUEST", message }] : undefined;
    super(message, 400, "BAD_REQUEST", errors);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation Error", errors?: unknown[]) {
    super(message, 422, "VALIDATION_ERROR", errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too Many Requests") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}
