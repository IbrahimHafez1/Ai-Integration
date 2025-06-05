import axios from 'axios';
import { getSlackAccessToken } from './slackOAuthService.js';
import { LeadLog } from '../models/LeadLog.js';
import { createLead } from './crmService.js';
import { sendLeadStatusEmail } from './notificationService.js';
import { getIO } from '../utils/socket.js';
import { logger } from '../utils/logger.js';
import { Types } from 'mongoose';

export async function pollSlackMessages(userId: string, channelId: string): Promise<void> {
  const accessToken = await getSlackAccessToken(userId);

  let resp;
  try {
    resp = await axios.get('https://slack.com/api/conversations.history', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { channel: channelId, limit: 10 },
    });
  } catch (error: any) {
    throw new Error(`Slack API error: ${error.message}`);
  }

  if (!resp.data.ok) {
    throw new Error(`Slack error: ${resp.data.error}`);
  }

  const messages: any[] = resp.data.messages || [];
  for (const msg of messages) {
    const leadLog = new LeadLog({
      userId,
      provider: 'slack',
      eventType: 'new_message',
      payload: msg,
    });

    await leadLog.save();

    // Emit newLead event
    try {
      getIO().to(userId).emit('newLead', {
        leadId: leadLog._id,
        timestamp: leadLog.createdAt,
        messageText: msg.text,
        slackUser: msg.user,
      });
    } catch (ioErr) {
      logger.error(`Socket emit error (newLead): ${ioErr}`);
    }

    const leadId = (leadLog._id as Types.ObjectId).toString();

    try {
      const zohoPayload = {
        Last_Name: msg.user || 'Slack User',
        Description: msg.text,
        Lead_Source: 'Slack',
        Custom_Field_TS: msg.ts,
        LeadLog_Id: leadId,
      };

      const zohoResult = await createLead(zohoPayload);

      getIO()
        .to(userId)
        .emit('crmStatus', {
          leadId,
          status: zohoResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILURE',
        });

      if (zohoResult.status !== 'SUCCESS') {
        logger.error(`Zoho CRM returned failure for LeadLog ${leadId}: ${zohoResult.message}`);
      }
    } catch (crmErr: any) {
      logger.error(`CRM insertion failed for LeadLog ${leadId}: ${crmErr.message}`);
      getIO().to(userId).emit('crmStatus', {
        leadId,
        status: 'FAILURE',
      });
    }

    // Optionally send an email (e.g., via Gmail) about this lead
    try {
      await sendLeadStatusEmail(userId, leadId, false);
    } catch (emailErr) {
      logger.error(`Failed to send notification email for LeadLog ${leadId}: ${emailErr}`);
    }
  }
}
