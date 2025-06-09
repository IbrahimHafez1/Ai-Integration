import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendMail } from './emailService.js';
import { logger } from '../utils/logger.js';
import { createLead } from './crmService.js';
import { parseLead } from './aiService.js';
import { withRetry } from '../utils/retry.js';
import { IUser } from '../models/User.js';
import { OAuthToken } from '../models/OAuthToken.js';

export interface RunSlackFlowParams {
  leadLog: any;
  user: IUser;
  zohoAccessToken: string;
}

export async function runSlackFlow({ leadLog, user }: RunSlackFlowParams) {
  try {
    const leadData = await parseLead(leadLog.text);

    const token = await OAuthToken.findOne({ userId: user._id, provider: 'zoho' });

    if (!token) {
      throw new Error('No Zoho token found for user');
    }

    const rawName = leadData?.name ?? 'John Doe';
    const [lastName, ...firstParts] = rawName.trim().split(' ');
    const firstName = firstParts.join(' ') || 'Unknown';

    const zohoPayload = {
      Last_Name: lastName || 'Doe',
      First_Name: firstName,
      Company: leadData?.company || 'Unknown Company',
      Email: leadData?.email || '',
      Phone: leadData?.phone || '',
      Description: leadData?.interest,
    };

    const crmResult = await withRetry(() => createLead(zohoPayload, token.accessToken), 3, 1000);
    const isSuccess = crmResult.status === 'SUCCESS';

    let logCreated = false;
    try {
      await CRMStatusLog.create({
        leadLogId: leadLog._id,
        status: isSuccess ? 'SUCCESS' : 'FAILURE',
        rawResponse: crmResult,
        userId: user._id,
      });
      logCreated = true;
    } catch (logError) {
      logger.error(`Failed to create CRMStatusLog for LeadLog ${leadLog._id}:`, logError);
    }

    if (logCreated) {
      const recipientEmail = user?.email;
      if (!recipientEmail) {
        logger.warn(`No email found for user ${user._id}, skipping notification.`);
      } else {
        try {
          await sendMail({
            to: recipientEmail,
            subject: isSuccess
              ? 'New Zoho Lead Created'
              : `Zoho Lead Creation FAILED for ${leadLog._id}`,
            text: isSuccess
              ? `✅ Lead created in Zoho (ID: ${crmResult.id}) for ${firstName} ${lastName}.`
              : `❌ Error creating lead in Zoho:\n${
                  crmResult.raw?.error || crmResult.message || 'Unknown error'
                }\n\nPayload:\n${JSON.stringify(zohoPayload, null, 2)}`,
          });
        } catch (emailErr) {
          logger.error(`Failed to send notification email to ${recipientEmail}:`, emailErr);
        }
      }
    }

    logger.info(`runSlackFlow completed for LeadLog ${leadLog._id}`);
  } catch (error: any) {
    logger.error(`runSlackFlow failed for LeadLog ${leadLog._id}:`, error);
    try {
      await CRMStatusLog.create({
        leadLogId: leadLog._id,
        status: 'FAILURE',
        rawResponse: { error: error.message },
        userId: user._id,
      });
    } catch (logError) {
      logger.error(`Failed to create failure CRMStatusLog for LeadLog ${leadLog._id}:`, logError);
    }
  }
}
