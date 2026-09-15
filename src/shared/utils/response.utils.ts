import { ApiResponse, Pagination } from "../types/interfaces";

export class ApiResponseHandler {
  static getSuccess<T>(
    message: string = "OK",
    data?: T,
    pagination?: Pagination,
    summary?: any,
  ) {
    const response: ApiResponse = {
      statusCode: 200,
      success: true,
      message,
      data,
      pagination,
      summary,
    };

    return response;
  }

  static createSuccess<T>(message: string = "OK", data?: T) {
    const response: ApiResponse = {
      statusCode: 201,
      success: true,
      message,
      data: data,
    };

    return response;
  }

  static updateSuccess<T>(message: string, data?: T) {
    const response: ApiResponse = {
      statusCode: 200,
      success: true,
      message,
      data,
    };

    return response;
  }

  static deleteSuccess<T>(message: string, data?: T) {
    const response: ApiResponse = {
      statusCode: 200,
      success: true,
      message,
      data,
    };

    return response;
  }

  static restoreSuccess<T>(message: string, data?: T) {
    const response: ApiResponse = {
      statusCode: 200,
      success: true,
      message,
      data,
    };

    return response;
  }

  static error(
    statusCode: number,
    message: string,
    data?: any,
    errors?: any,
    requestId?: string,
  ) {
    const response: ApiResponse = {
      statusCode: statusCode,
      success: false,
      message,
      data,
      errors,
    };
    return response;
  }
}
