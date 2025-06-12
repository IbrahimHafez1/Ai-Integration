import { CRMStatusLog } from '../models/CRMStatusLog.js';
import { sendMail } from './emailService.js';
import { logger } from '../utils/logger.js';
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
  // Remove or escape characters that could cause template literal issues
  // Replace backticks to prevent template literal execution
  // Replace ${} patterns to prevent variable interpolation
  return text
    .replace(/`/g, "'") // Replace backticks with single quotes
    .replace(/\$\{/g, '$\\{') // Escape template literal variable patterns
    .trim();
}

export async function runSlackFlow({ leadLog, user }: RunSlackFlowParams) {
  try {
    // The agent will handle all the processing and CRM interaction
    const parseResult = await withRetry(
      async () => {
        // Properly sanitize the text to prevent template literal issues
        const sanitizedText = sanitizeTextForProcessing(leadLog.text);
        return parseLead(sanitizedText, user._id);
      },
      3,
      1000,
    );

    const isSuccess = parseResult.status === 'SUCCESS';

    // Log the result
    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      rawResponse: parseResult,
      userId: user._id,
    });

    // Send email notification
    const recipientEmail = user?.gmail;
    if (recipientEmail) {
      try {
        await sendMail({
          to: recipientEmail,
          subject: isSuccess ? 'New Zoho Lead Created' : 'Zoho Lead Creation Failed',
          text: isSuccess
            ? `✅ Lead created in Zoho (ID: ${parseResult.id})`
            : `❌ Error creating lead:\n${parseResult.message || 'Unknown error'}`,
        });
      } catch (emailErr) {
        logger.error(`Failed to send notification email to ${recipientEmail}:`, emailErr);
      }
    }

    return parseResult;
  } catch (error: any) {
    logger.error(`runSlackFlow failed for LeadLog ${leadLog._id}:`, error);

    // Log the failure
    await CRMStatusLog.create({
      leadLogId: leadLog._id,
      status: 'FAILURE',
      rawResponse: { error: error.message },
      userId: user._id,
    });

    throw error;
  }
}
