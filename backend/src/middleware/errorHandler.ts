import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = undefined;

  // Handle different error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.message;
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    statusCode = 500;
    message = 'Database Error';
    if (process.env.NODE_ENV === 'development') {
      details = err.message;
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
  } else if (err.message) {
    message = err.message;
  }

  // Log error with context
  const errorContext = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorContext);
  } else {
    logger.warn('Client Error:', errorContext);
  }

  // Send error response
  const response: any = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include details and stack trace in development
  if (process.env.NODE_ENV === 'development') {
    if (details) response.error.details = details;
    if (err.stack) response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
