import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, any>;
}

export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200,
  meta?: Record<string, any>,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
};
