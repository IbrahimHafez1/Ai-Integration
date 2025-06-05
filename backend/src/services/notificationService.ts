import nodemailer from 'nodemailer';
import { getGmailAccessToken } from './googleOAuthService.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/errors.js';

/**
 * Send an email to the user about lead creation status.
 * Requires that the user has connected Gmail via OAuth (so there's a Gmail OAuthToken stored).
 */
export async function sendLeadStatusEmail(
  userId: string,
  leadLogId: string,
  success: boolean,
): Promise<void> {
  // 1. Fetch user email
  const user = await User.findById(userId).select('email').lean();
  if (!user) throw new ApiError('User not found', 404);

  // 2. Fetch a valid Gmail access token
  const accessToken = await getGmailAccessToken(userId);

  // 3. Create Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: user.email,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      refreshToken: accessToken.refreshToken,
      accessToken: accessToken.token,
    },
  });

  const subject = success ? `Lead Created: ${leadLogId}` : `Lead Creation Failed: ${leadLogId}`;
  const text = success
    ? `Your Slack message (ID: ${leadLogId}) was successfully inserted into the CRM.`
    : `Insertion failed for Slack message (ID: ${leadLogId}). Please check logs.`;

  await transporter.sendMail({
    from: `"Dragify Bot" <no-reply@dragify.io>`,
    to: user.email,
    subject,
    text,
  });
}
