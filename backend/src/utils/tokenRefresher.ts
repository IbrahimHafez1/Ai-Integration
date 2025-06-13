import { OAuthToken } from '../models/OAuthToken.js';
import axios from 'axios';
import config from '../config/index.js';
import logger from './logger.js';

export async function ensureValidToken(
  userId: string,
  provider: 'zoho' | 'google',
): Promise<string> {
  const token = await OAuthToken.findOne({ userId, provider });

  if (!token) {
    throw new Error(`No ${provider} token found for user`);
  }

  // If token is still valid, return it
  if (token.expiresAt && token.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return token.accessToken;
  }

  // Token needs refresh
  let newToken;
  try {
    if (provider === 'zoho') {
      const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        new URLSearchParams({
          refresh_token: token.refreshToken,
          client_id: config.oauth.zoho.clientId,
          client_secret: config.oauth.zoho.clientSecret,
          grant_type: 'refresh_token',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      newToken = {
        accessToken: response.data.access_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      };
    } else if (provider === 'google') {
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        config.oauth.google.clientId,
        config.oauth.google.clientSecret,
        config.oauth.google.redirectUri,
      );
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });

      const response = await oauth2Client.getAccessToken();
      const credentials = response.res?.data;

      if (!credentials?.access_token || !credentials.expiry_date) {
        throw new Error('Failed to refresh Google token');
      }

      newToken = {
        accessToken: credentials.access_token,
        expiresAt: new Date(credentials.expiry_date),
      };
    }

    if (!newToken) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Update token in database
    await OAuthToken.findByIdAndUpdate(token._id, {
      $set: {
        accessToken: newToken.accessToken,
        expiresAt: newToken.expiresAt,
      },
    });

    return newToken.accessToken;
  } catch (error) {
    logger.error(`Error refreshing ${provider} token:`, error);
    throw new Error(`Failed to refresh ${provider} token`);
  }
}
