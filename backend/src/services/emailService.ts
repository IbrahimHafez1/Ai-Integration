import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import tokenService from './tokenService.js';
import config from '../config/index.js';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  providerConfig: { provider: 'gmail'; email: string };
}

export async function sendEmail(options: EmailOptions): Promise<any> {
  const { to, subject, body, providerConfig } = options;

  const tokenDoc = await tokenService.getTokens('google', providerConfig.email);
  if (!tokenDoc || !tokenDoc.refreshToken) {
    throw new Error(`No valid Gmail tokens for user ${providerConfig.email}`);
  }

  const oAuth2Client = new google.auth.OAuth2(
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
    config.oauth.google.redirectUri,
  );

  oAuth2Client.setCredentials({ refresh_token: tokenDoc.refreshToken });

  // Use Gmail API instead of nodemailer
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  // Create the email message
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const messageParts = [
    `From: ${providerConfig.email}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    body,
  ];

  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return result;
  } catch (error) {
    console.error('Gmail API send error:', error);
    throw error;
  }
}
