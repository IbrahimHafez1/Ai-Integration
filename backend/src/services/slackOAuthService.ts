import axios from 'axios';
import { OAuthToken, IOAuthToken } from '../models/OAuthToken.js';
import { ApiError } from '../utils/errors.js';
import config from '../config/index.js';

export async function exchangeSlackCodeAndSave(userId: string, code: string): Promise<IOAuthToken> {
  const tokenUrl = 'https://slack.com/api/oauth.v2.access';
  const params = {
    client_id: config.oauth.slack.clientId,
    client_secret: config.oauth.slack.clientSecret,
    code,
    redirect_uri: config.oauth.slack.redirectUri,
  };

  let resp;

  try {
    resp = await axios.post(tokenUrl, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (error: any) {
    throw new ApiError(`Slack OAuth error: ${error.message}`, 500);
  }

  if (!resp.data.ok) {
    throw new ApiError(`Slack OAuth failed: ${resp.data.error}`, 400);
  }

  const { access_token, refresh_token, expires_in } = resp.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

  // Upsert into OAuthToken collection
  const filter = { userId, provider: 'slack' as const };
  const update = { accessToken: access_token, refreshToken: refresh_token, expiresAt };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const tokenDoc = await OAuthToken.findOneAndUpdate(filter, update, options).lean();
  return tokenDoc as IOAuthToken;
}

/**
 * Retrieve a valid Slack access token for the given user (refresh logic omitted since Slack tokens rarely expire).
 */
export async function getSlackAccessToken(userId: string): Promise<string> {
  const tokenDoc = await OAuthToken.findOne({ userId, provider: 'slack' }).lean();
  if (!tokenDoc) {
    throw new ApiError('Slack not connected', 404);
  }
  return tokenDoc.accessToken;
}
