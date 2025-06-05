import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = '') => {
  return res.status(200).json({ success: true, data, message });
};

export const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({ success: false, data: null, message });
};
