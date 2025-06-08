import { Request, Response } from 'express';
import { LeadLog } from '../models/LeadLog.js';
import { logger } from '../utils/logger.js';
import { runSlackFlow } from '../services/orchestrationService.js';
import User from '../models/User.js';

export async function handleSlackEvents(req: Request, res: Response): Promise<void> {
  try {
    const { type, event, challenge } = req.body;

    if (!type) {
      logger.warn('Missing Slack event type');
      res.status(400).json({ success: false, message: 'Missing event type', data: null });
      return;
    }

    if (type === 'url_verification') {
      if (!challenge) {
        logger.warn('Missing Slack challenge token');
        res.status(400).json({ success: false, message: 'Missing challenge', data: null });
        return;
      }

      res.status(200).json({
        success: true,
        data: { challenge },
        message: 'Challenge token verified',
      });
      return;
    }

    if (type === 'event_callback') {
      if (!event || typeof event !== 'object') {
        logger.warn('Invalid Slack event format');
        res.status(400).json({ success: false, message: 'Invalid event format', data: null });
        return;
      }

      const { type: eventType, text, user, channel, bot_id } = event;

      if (eventType === 'message' && !bot_id && text && channel && user) {
        logger.info(`Slack message received: ${text} (from ${user} in ${channel})`);

        const leadLog = await LeadLog.create({
          text,
          slackUserId: user,
          channelId: channel,
          eventType,
        });

        await runSlackFlow({ leadLog }).catch((err: any) =>
          logger.error('Error running Slack flow:', err),
        );
      }
    }

    res.status(200).json({ success: true, data: null, message: 'Event processed' });
  } catch (error: any) {
    console.log({ error });
    logger.error('Slack event handler error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
    return;
  }
}

export const checkSlackConnection = async (req: any, res: Response) => {
  try {
    const userId = req?.user!._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId).select('slackAccessToken').lean();

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const isConnected = Boolean(user.slackAccessToken);

    res.status(200).json({
      success: true,
      data: { connected: isConnected },
      message: isConnected ? 'Slack is connected' : 'Slack is not connected',
    });
    return;
  } catch (error: any) {
    logger.error('Error checking Slack connection', { error: error.message });
    res.status(500).json({
      success: false,
      data: null,
      message: 'Internal server error',
    });
    return;
  }
};
