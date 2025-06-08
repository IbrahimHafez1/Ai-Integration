import { Request, Response } from 'express';
import User from '../models/User.js';
import { LeadLog } from '../models/LeadLog.js';
import { logger } from '../utils/logger.js';
import { runSlackFlow } from '../services/orchestrationService.js';
import { OAuthToken } from '../models/OAuthToken.js';

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
      const { type: eventType, text, user: slackUserId, channel, bot_id, token } = event;
      if (eventType === 'message' && !bot_id && text && channel && slackUserId) {
        logger.info(`Received Slack message: ${text}`);

        const leadLog = await LeadLog.create({ text, slackUserId, channelId: channel, eventType });

        const tokenDoc = await OAuthToken.findOne({
          provider: 'slack',
          accessToken: token,
        }).lean();

        if (!tokenDoc) {
          logger.warn(`No Slack token found`);
          return;
        }

        const user = await User.findOne({ slackAccessToken: tokenDoc._id.toString() }).lean();
        if (!user) {
          logger.warn(`No internal user linked for Slack ID ${slackUserId}`);
          res.status(404).json({ success: false, message: 'User not linked', data: null });
          return;
        }

        if (!user.zohoAccessToken) {
          logger.warn(`User ${user._id} has no Zoho token; continuing without it`);
          return;
        }

        await runSlackFlow({
          leadLog,
          user,
          zohoAccessToken: user.zohoAccessToken,
        }).catch((err) => {
          logger.error('Error running Slack flow:', err);
        });
      }
    }

    res.status(200).json({ success: true, data: null, message: 'Event processed' });
    return;
  } catch (error: any) {
    logger.error('Slack event handler error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error', data: null });
    return;
  }
}
