// services/slackOAuthService.js
import axios from 'axios';
import { OAuthToken } from '../models/OAuthToken.js';
import { ApiError } from '../utils/errors.js';
import config from '../config/index.js';
import User from '../models/User.js';

/**
 * Exchange Slack “code” for tokens, then upsert into Mongo.
 * Returns the saved token document (lean’ed).
 */
export async function exchangeSlackCodeAndSave(userId: string, code: string) {
  const tokenUrl = 'https://slack.com/api/oauth.v2.access';
  const params = new URLSearchParams({
    client_id: config.oauth.slack.clientId,
    client_secret: config.oauth.slack.clientSecret,
    code,
    redirect_uri: config.oauth.slack.redirectUri,
  });

  let resp;
  try {
    resp = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err: any) {
    throw new ApiError(`Slack OAuth request failed: ${err.message}`, 500);
  }

  if (!resp.data.ok) {
    throw new ApiError(`Slack OAuth failed: ${resp.data.error}`, 400);
  }

  const { access_token } = resp.data;

  const filter = { userId, provider: 'slack' };
  const update = {
    accessToken: access_token,
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  // Upsert the OAuthToken document
  const token = await OAuthToken.findOneAndUpdate(filter, update, options);

  if (!token) {
    throw new ApiError('Failed to save token', 500);
  }

  await User.findByIdAndUpdate(userId, { slackAccessToken: token._id });

  return token;
}

/**
 * Return a valid Slack access token for this user, or throw 404 if none.
 * (Slack’s OAuth tokens usually do not expire for basic apps; adjust refresh logic if needed.)
 */
export async function getSlackAccessToken(userId: string) {
  const tokenDoc = await OAuthToken.findOne({ userId, provider: 'slack' }).lean();
  if (!tokenDoc) {
    throw new ApiError('Slack not connected', 404);
  }
  return tokenDoc.accessToken;
}
