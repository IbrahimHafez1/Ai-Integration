import { Request, Response, NextFunction } from 'express';
import { LeadLog } from '../models/LeadLog.js';
import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/errors.js';

export async function getLeadLogs(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user.id;
    const logs = await LeadLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    sendSuccess(res, logs, 'Lead logs fetched');
    return;
  } catch (err) {
    next(err);
  }
}

export async function getCRMLogs(req: any, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user._id;
    const crmLogs = await CRMStatusLog.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

    if (!crmLogs) {
      throw new ApiError('No CRM logs found', 404);
    }

    sendSuccess(res, crmLogs, 'CRM logs fetched');
    return;
  } catch (err) {
    next(err);
  }
}
