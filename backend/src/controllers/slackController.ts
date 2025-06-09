import { Request, Response } from 'express';
import User from '../models/User.js';
import { LeadLog } from '../models/LeadLog.js';
import { logger } from '../utils/logger.js';
import { runSlackFlow } from '../services/orchestrationService.js';
import { parseLead } from '../services/aiService.js';

export async function handleSlackEvents(req: Request, res: Response): Promise<void> {
  try {
    const { type, event, challenge } = req.body;

    if (!type) {
      logger.warn('Missing Slack event type');
      res.status(400).json({ success: false, data: null, message: 'Missing event type' });
      return;
    }

    if (type === 'url_verification') {
      if (!challenge) {
        logger.warn('Missing Slack challenge token');
        res.status(400).json({ success: false, data: null, message: 'Missing challenge' });
        return;
      }
      res
        .status(200)
        .json({ success: true, data: { challenge }, message: 'Challenge token verified' });
      return;
    }

    if (type === 'event_callback') {
      if (!event || typeof event !== 'object') {
        logger.warn('Invalid Slack event format');
        res.status(400).json({ success: false, data: null, message: 'Invalid event format' });
        return;
      }

      const { type: eventType, text, user: slackUserId, channel, bot_id } = event;
      if (eventType === 'message' && !bot_id && text && slackUserId && channel) {
        logger.info(`Received Slack message: ${text}`);

        let leadData;
        try {
          leadData = await parseLead(text);
        } catch (err: any) {
          logger.error('Error parsing lead data:', err);
          res
            .status(200)
            .json({ success: true, data: null, message: 'Event processed (no lead detected)' });
          return;
        }

        if (!leadData?.interest) {
          logger.info('Message parsed but no interest found; skipping lead creation');
          res
            .status(200)
            .json({ success: true, data: null, message: 'No lead interest found; event ignored' });
          return;
        }

        const leadLog = await LeadLog.create({
          text,
          slackUserId,
          channelId: channel,
          eventType,
          parsedInterest: leadData.interest,
        });

        const user = await User.findOne({ slackUserId }).lean();
        if (!user) {
          logger.warn(`No internal user linked for Slack ID ${slackUserId}`);
          res.status(404).json({ success: false, data: null, message: 'User not linked' });
          return;
        }
        if (!user.zohoAccessToken) {
          logger.warn(`User ${user._id} has no Zoho token; skipping CRM flow`);
          res.status(200).json({ success: true, data: null, message: 'No Zoho token' });
          return;
        }

        await runSlackFlow({ leadLog, user, zohoAccessToken: user.zohoAccessToken });

        res.status(200).json({ success: true, data: null, message: 'Lead processed successfully' });
        return;
      }
    }

    // fallback for other events
    res.status(200).json({ success: true, data: null, message: 'Event processed' });
    return;
  } catch (error: any) {
    logger.error('Slack event handler error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, data: null, message: 'Internal server error' });
    return;
  }
}
