import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendMail } from './emailService.js';
import { logger } from '../utils/logger.js';
import { createLead } from './crmService.js';
import { parseLead } from './airService.js';
import { withRetry } from '../utils/retry.js';

export async function runSlackFlow({ leadLog }: { leadLog: any }) {
  try {
    const leadData = await parseLead(leadLog.text);
    console.log({ leadData });

    const rawName = leadData?.name ?? 'Unknown Unknown';
    const nameParts = rawName.trim().split(' ');
    const lastName = nameParts[0] || 'Unknown';
    const firstName = nameParts.slice(1).join(' ') || 'Unknown';

    const zohoPayload = {
      Last_Name: lastName,
      First_Name: firstName,
      Company: leadData?.company || 'Unknown Company',
      Email: leadData?.email || '',
      Phone: leadData?.phone || '',
      Description: leadData?.interest
        ? `Interested in: ${leadData.interest}`
        : 'No specific interest provided',
    };

    const crmResult = await withRetry(() => createLead(zohoPayload), 3, 1000);
    const isSuccess = crmResult.status === 'SUCCESS';

    let logCreated = false;
    try {
      await CRMStatusLog.create({
        leadLogId: leadLog._id,
        status: isSuccess ? 'SUCCESS' : 'FAILURE',
        rawResponse: crmResult,
      });
      logCreated = true;
    } catch (logError) {
      logger.error(`Failed to create CRMStatusLog for LeadLog ${leadLog._id}:`, logError);
    }

    if (logCreated) {
      try {
        const recipientEmail = process.env.NOTIFY_EMAIL!;
        await sendMail({
          to: recipientEmail,
          subject: isSuccess
            ? 'New Zoho Lead Created'
            : `Zoho Lead Creation FAILED for ${leadLog._id}`,
          text: isSuccess
            ? `Lead ID ${crmResult.id} created for ${firstName} ${lastName}.`
            : `Error: ${crmResult.raw?.error || crmResult.message || 'Unknown error'}\n\nLead Data: ${JSON.stringify(zohoPayload, null, 2)}`,
        });
      } catch (emailErr) {
        logger.error(`Failed to send SlackFlow email for LeadLog ${leadLog._id}:`, emailErr);
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
      });
    } catch (logError) {
      logger.error(`Failed to create failure CRMStatusLog for LeadLog ${leadLog._id}:`, logError);
    }
  }
}
