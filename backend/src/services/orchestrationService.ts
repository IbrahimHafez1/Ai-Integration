import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendMail } from './emailService.js';
import { logger } from '../utils/logger.js';
import { createLead } from './crmService.js';

export async function runSlackFlow({ leadLog }: { leadLog: any }) {
  try {
    // Parse lead data
    const [fullName, company, email, phone] = leadLog.text.split('|').map((s: string) => s.trim());
    const [lastName, ...firstNameParts] = fullName.split(' ');
    const firstName = firstNameParts.join(' ');

    // Prepare CRM payload
    const zohoPayload = {
      Last_Name: lastName,
      First_Name: firstName,
      Company: company,
      Email: email,
      Phone: phone,
    };

    // Create CRM lead
    const crmResult = await createLead(zohoPayload);
    const isSuccess = crmResult.status === 'SUCCESS';

    // 1) Log CRM result
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
            : `Error: ${crmResult.raw?.error || crmResult.message || 'Unknown error'}`,
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
