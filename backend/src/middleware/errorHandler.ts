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

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  logger.error(`[${req.method} ${req.path}] ${message} - ${statusCode}`);
  res.status(statusCode).json({ success: false, data: null, message });
};
