import { Request, Response, NextFunction } from 'express';
import { TriggerConfig } from '../models/TriggerConfig.js';
import { logger } from '../utils/logger.js';

export async function createTriggerConfig(req: any, res: Response): Promise<void> {
  try {
    const { channelId } = req.body;
    console.log({ req });
    const userId = req.user?._id;
    console.log({ userId });
    if (!channelId) {
      res.status(400).json({ success: false, message: 'channelId is required', data: null });
      return;
    }

    const existing = await TriggerConfig.findOne({
      'settings.channelId': channelId,
      userId,
    }).lean();

    if (existing) {
      res.status(409).json({
        success: false,
        message: 'Trigger already exists for this channel',
        data: null,
      });
      return;
    }

    const newTrigger = await TriggerConfig.create({
      userId,
      settings: { channelId },
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Trigger created successfully',
      data: newTrigger,
    });
    return;
  } catch (error: any) {
    logger.error('Failed to create TriggerConfig', error);
    res.status(500).json({ success: false, message: 'Server error', data: null });
    return;
  }
}

export async function getTriggerConfigs(req: any, res: Response, next: NextFunction) {
  try {
    const configs = await TriggerConfig.find({ userId: req.user._id }).lean();
    if (!configs) {
      res.status(404).json({ success: false, message: 'Trigger configs not found', data: null });
      return;
    }

    res.json({ success: true, data: configs, message: 'Trigger configs fetched' });
    return;
  } catch (err) {
    next(err);
  }
}

export async function updateTriggerConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await TriggerConfig.findByIdAndUpdate(req.params.configId, req.body, {
      new: true,
    });
    res.json({ success: true, data: updated, message: 'Trigger updated' });
    return;
  } catch (err) {
    next(err);
  }
}

export async function deleteTriggerConfig(req: Request, res: Response, next: NextFunction) {
  try {
    await TriggerConfig.findByIdAndDelete(req.params.configId);
    res.json({ success: true, data: null, message: 'Trigger deleted' });
    return;
  } catch (err) {
    next(err);
  }
}
