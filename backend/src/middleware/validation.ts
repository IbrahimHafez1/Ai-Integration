import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../utils/errors.js';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const extractedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.path.reduce((obj, key) => obj?.[key], req.body),
        }));
        
        throw new ApiError('Validation failed', 400, true);
      }
      next(error);
    }
  };
};
