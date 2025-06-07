import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import tokenService from './tokenService.js';
import config from '../config/index.js';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  providerConfig: { provider: 'gmail'; userId: string };
}

export async function sendEmail(options: EmailOptions): Promise<any> {
  const { to, subject, body, providerConfig } = options;

  const tokenDoc = await tokenService.getTokens('google', providerConfig.userId);
  if (!tokenDoc || !tokenDoc.refreshToken) {
    throw new Error(`No valid Gmail tokens for user ${providerConfig.userId}`);
  }

  const oAuth2Client = new google.auth.OAuth2(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
    config.oauth.google.redirectUri,
  );
  oAuth2Client.setCredentials({ refresh_token: tokenDoc.refreshToken });

  const { token: accessToken } = await oAuth2Client.getAccessToken();
  if (!accessToken) throw new Error('Failed to refresh Gmail access token');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: providerConfig.userId,
      clientId: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      refreshToken: tokenDoc.refreshToken,
      accessToken,
    },
  });

  const mailOptions = {
    from: `No-Reply <${providerConfig.userId}>`,
    to,
    subject,
    text: body,
    html: `<p>${body}</p>`,
  };

  return transporter.sendMail(mailOptions);
}
