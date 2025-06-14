import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export interface RequestWithContext extends Request {
  requestId?: string;
  startTime?: number;
}

export const requestLogger = (req: RequestWithContext, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = Math.random().toString(36).substring(2, 15);
  req.startTime = Date.now();

  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed successfully', logData);
    }
  });

  next();
};
