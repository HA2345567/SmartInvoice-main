import { NextResponse } from 'next/server';
import config from './config';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  userMessage?: string;
  isOperational?: boolean;
}

export class ErrorHandler {
  static createError(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = isOperational;
    error.userMessage = message;
    return error;
  }

  static handleError(error: unknown): AppError {
    if (error instanceof Error) {
      const appError = error as AppError;
      
      // If it's already an AppError, return it
      if (appError.statusCode) {
        return appError;
      }

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return this.createError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          true
        );
      }

      if (error.name === 'UnauthorizedError') {
        return this.createError(
          'Unauthorized access',
          401,
          'UNAUTHORIZED',
          true
        );
      }

      if (error.name === 'NotFoundError') {
        return this.createError(
          'Resource not found',
          404,
          'NOT_FOUND',
          true
        );
      }

      // Default error
      return this.createError(
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
        false
      );
    }

    // Handle non-Error objects
    return this.createError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      false
    );
  }

  static logError(error: AppError, context?: string): void {
    if (config.isDevelopment) {
      console.error(`[${context || 'Error'}]`, {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    } else {
      // In production, you might want to send to a logging service
      console.error(`[${context || 'Error'}] ${error.message}`, {
        statusCode: error.statusCode,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static sendErrorResponse(error: AppError): NextResponse {
    const statusCode = error.statusCode || 500;
    const response = {
      error: error.userMessage || 'An error occurred',
      ...(config.isDevelopment && {
        details: error.message,
        code: error.code,
        stack: error.stack,
      }),
    };

    return NextResponse.json(response, { status: statusCode });
  }

  static async handleAsyncError<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: AppError | null }> {
    try {
      const data = await promise;
      return { data, error: null };
    } catch (error) {
      const appError = this.handleError(error);
      this.logError(appError, context);
      return { data: null, error: appError };
    }
  }

  // Common error creators
  static validationError(message: string): AppError {
    return this.createError(message, 400, 'VALIDATION_ERROR');
  }

  static unauthorizedError(message: string = 'Unauthorized access'): AppError {
    return this.createError(message, 401, 'UNAUTHORIZED');
  }

  static forbiddenError(message: string = 'Access forbidden'): AppError {
    return this.createError(message, 403, 'FORBIDDEN');
  }

  static notFoundError(message: string = 'Resource not found'): AppError {
    return this.createError(message, 404, 'NOT_FOUND');
  }

  static conflictError(message: string = 'Resource conflict'): AppError {
    return this.createError(message, 409, 'CONFLICT');
  }

  static tooManyRequestsError(message: string = 'Too many requests'): AppError {
    return this.createError(message, 429, 'RATE_LIMIT');
  }

  static internalError(message: string = 'Internal server error'): AppError {
    return this.createError(message, 500, 'INTERNAL_ERROR', false);
  }

  static serviceUnavailableError(message: string = 'Service unavailable'): AppError {
    return this.createError(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// Validation utilities
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Middleware for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      throw appError;
    }
  };
} 