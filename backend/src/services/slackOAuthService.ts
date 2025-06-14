import axios from 'axios';
import { OAuthToken } from '../models/OAuthToken.js';
import { ApiError } from '../utils/errors.js';
import config from '../config/index.js';
import User from '../models/User.js';

export async function exchangeSlackCodeAndSave(userId: string, code: string) {
  const tokenUrl = 'https://slack.com/api/oauth.v2.access';
  const params = new URLSearchParams({
    client_id: config.slack.clientId,
    client_secret: config.slack.clientSecret,
    code,
    redirect_uri: config.slack.redirectUri,
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

  const { access_token, authed_user } = resp.data;

  const filter = { userId, provider: 'slack' };
  const update = {
    accessToken: access_token,
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const token = await OAuthToken.findOneAndUpdate(filter, update, options);

  if (!token) {
    throw new ApiError('Failed to save token', 500);
  }

  await User.findByIdAndUpdate(userId, {
    slackAccessToken: token._id,
    slackUserId: authed_user.id,
  });

  return token;
}
