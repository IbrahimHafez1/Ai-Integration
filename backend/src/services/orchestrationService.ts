import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendMail } from './emailService.js';
import logger from '../utils/logger.js';
import { parseLead } from './aiService.js';
import { withRetry } from '../utils/retry.js';
import type { ILeanUser } from '../models/User.js';

export interface RunSlackFlowParams {
  leadLog: {
    _id: string;
    text: string;
  };
  user: ILeanUser;
}

function sanitizeTextForProcessing(text: string): string {
  return text.replace(/`/g, "'").replace(/\$\{/g, '$\\{').trim();
}

export async function runSlackFlow({ leadLog, user }: RunSlackFlowParams) {
  try {
    const parseResult = await withRetry(
      async () => {
        const sanitizedText = sanitizeTextForProcessing(leadLog.text);
        return parseLead(sanitizedText, user._id);
      },
      3,
      1000,
    );

    const isSuccess = parseResult.status === 'SUCCESS';
    const observationData = JSON.parse(parseResult.intermediateSteps[3].observation);
    const leadId = observationData.id;

    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      rawResponse: parseResult,
      userId: user._id,
    });

    const recipientEmail = user?.gmail;
    if (recipientEmail) {
      try {
        await sendMail({
          to: recipientEmail,
          subject: isSuccess ? 'New Zoho Lead Created' : 'Zoho Lead Creation Failed',
          text: isSuccess
            ? `✅ Lead created in Zoho (ID: ${leadId})`
            : `❌ Error creating lead:\n${parseResult.message || 'Unknown error'}`,
        });
      } catch (emailErr) {
        logger.error(`Failed to send notification email to ${recipientEmail}:`, emailErr);
      }
    }

    return parseResult;
  } catch (error: any) {
    logger.error(`runSlackFlow failed for LeadLog ${leadLog._id}:`, error);

    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: 'FAILURE',
      rawResponse: { error: error.message },
      userId: user._id,
    });

    throw error;
  }
}
