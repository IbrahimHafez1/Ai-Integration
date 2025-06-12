import { Request, Response } from 'express';
import User, { ILeanUser } from '../models/User.js';
import { LeadLog, ILeadLog } from '../models/LeadLog.js';
import { logger } from '../utils/logger.js';
import { runSlackFlow } from '../services/orchestrationService.js';
import { getIO } from '../utils/socket.js';
import mongoose from 'mongoose';

// Move this outside the function to persist between requests
const seenEventIds = new Set<string>();

export async function handleSlackEvents(req: Request, res: Response): Promise<void> {
  try {
    const { type, event, challenge, event_id } = req.body;

    if (event_id && seenEventIds.has(event_id)) {
      logger.warn('Duplicate Slack event', { event_id });
      res.status(200).json({ success: true, data: null, message: 'Duplicate event' });
      return;
    }

    if (event_id) {
      seenEventIds.add(event_id);
      if (seenEventIds.size > 1000) {
        seenEventIds.clear();
      }
    }

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

        const newLeadLog = (await LeadLog.create({
          text,
          slackUserId,
          channelId: channel,
          eventType,
        })) as ILeadLog & { _id: mongoose.Types.ObjectId };

        // Find user and convert ObjectId to string for downstream processing
        const userDoc = await User.findOne({ slackUserId });
        if (!userDoc) {
          logger.warn(`No internal user linked for Slack ID ${slackUserId}`);
          res.status(404).json({ success: false, data: null, message: 'User not linked' });
          return;
        }

        const userId = (userDoc._id as mongoose.Types.ObjectId).toString();

        if (!userDoc.zohoAccessToken) {
          logger.warn(`User ${userId} has no Zoho token; skipping CRM flow`);
          res.status(200).json({ success: true, data: null, message: 'No Zoho token' });
          return;
        }

        try {
          const userForFlow: ILeanUser = {
            ...userDoc.toObject(),
            _id: userId,
          };

          const result = await runSlackFlow({
            leadLog: {
              _id: (newLeadLog._id as mongoose.Types.ObjectId).toString(),
              text: newLeadLog.text,
            },
            user: userForFlow,
          });

          // Emit socket event with result
          const io = getIO();
          io.to(userId).emit('leadCreated', {
            leadId: (newLeadLog._id as mongoose.Types.ObjectId).toString(),
            text: newLeadLog.text,
            createdAt: newLeadLog.createdAt,
            status: result.status,
          });

          res.status(200).json({
            success: true,
            data: { leadId: newLeadLog._id.toString(), status: result.status },
            message: 'Lead processed successfully',
          });
          return;
        } catch (error: any) {
          logger.error('Error in Slack flow:', error);
          res.status(500).json({
            success: false,
            data: null,
            message: error.message || 'Error processing lead',
          });
          return;
        }
      }
    }

    res.status(200).json({ success: true, data: null, message: 'Event processed' });
    return;
  } catch (error: any) {
    logger.error('Error handling Slack event:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: error.message || 'Internal server error',
    });
    return;
  }
}
