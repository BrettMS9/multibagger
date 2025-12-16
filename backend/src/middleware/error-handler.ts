import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  status: 'error' | 'fail';
  message: string;
  stack?: string;
  errors?: any;
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors
    statusCode = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    // Handle auth errors
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.message) {
    // Use the error message if available
    message = err.message;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Log error for monitoring
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    statusCode,
    message,
    isOperational,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    404,
    `Cannot ${req.method} ${req.path}`
  );
  next(error);
};

/**
 * Validation error helper
 */
export const validationError = (message: string): AppError => {
  return new AppError(400, message);
};

/**
 * Unauthorized error helper
 */
export const unauthorizedError = (message = 'Unauthorized'): AppError => {
  return new AppError(401, message);
};

/**
 * Forbidden error helper
 */
export const forbiddenError = (message = 'Forbidden'): AppError => {
  return new AppError(403, message);
};

/**
 * Not found error helper
 */
export const notFoundError = (message = 'Resource not found'): AppError => {
  return new AppError(404, message);
};

/**
 * Server error helper
 */
export const serverError = (message = 'Internal server error'): AppError => {
  return new AppError(500, message);
};
