import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendEmail } from './notificationServices.js';
import { logger } from '../utils/logger.js';
import { createLead } from './crmService.js';

interface SlackFlowContext {
  leadLog: any;
  slackEvent: any;
}

export async function runSlackFlow({ leadLog, slackEvent }: SlackFlowContext): Promise<void> {
  try {
    console.log({ leadLog });
    const [fullName, company, email, phone] = leadLog.text.split('|').map((s: string) => s.trim());
    const [lastName, ...firstNameParts] = fullName.split(' ');
    const firstName = firstNameParts.join(' ');

    const zohoPayload = {
      Last_Name: lastName,
      First_Name: firstName,
      Company: company,
      Email: email,
      Phone: phone,
    };

    const crmResult = await createLead(zohoPayload);

    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: crmResult.status === 'success' ? 'SUCCESS' : 'FAILURE',
      rawResponse: crmResult,
    });

    await sendEmail({
      to: 'sales@Dragify.com',
      subject: `New Zoho Lead Created: ${zohoPayload.Company}`,
      body: `Lead ID ${crmResult.id} created for ${firstName} ${lastName}.`,
      providerConfig: {
        provider: 'gmail',
        userId: leadLog.slackUserId,
      },
    });

    logger.info(`Zoho lead created successfully for LeadLog ${leadLog._id}`);
  } catch (error: any) {
    logger.error(`runSlackFlow failed for LeadLog ${leadLog._id}: ${error.message}`);

    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: 'FAILURE',
      rawResponse: { error: error.message },
    });

    await sendEmail({
      to: 'sales@yourcompany.com',
      subject: `Zoho Lead Creation FAILED for LeadLog ${leadLog._id}`,
      body: `Error: ${error.message}`,
      providerConfig: {
        provider: 'gmail',
        userId: leadLog._id,
      },
    });
  }
}
