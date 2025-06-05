import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { ApiError } from '../utils/errors.js';

export interface AuthRequest extends Request {
  user?: { _id: string; email: string };
}

export const ensureAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError('Unauthorized', 401));
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { id: string; email: string };
    req.user = { _id: payload.id, email: payload.email };
    next();
  } catch (err) {
    console.log({ err });
    next(new ApiError('Invalid token', 401));
  }
};
