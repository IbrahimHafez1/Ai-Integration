import axios from 'axios';
import { OAuthToken, IOAuthToken } from '../models/OAuthToken.js';
import { ApiError } from '../utils/errors.js';
import config from '../config/index.js';

/**
 * Exchange a Google authorization code for tokens and save/update in MongoDB.
 * Scopes assumed to include "https://www.googleapis.com/auth/gmail.send" and/or others.
 */
export async function exchangeGoogleCodeAndSave(
  userId: string,
  code: string,
): Promise<IOAuthToken> {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = {
    client_id: config.oauth.google.clientId,
    client_secret: config.oauth.google.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.oauth.google.redirectUri,
  };

  let resp;
  try {
    resp = await axios.post(tokenUrl, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (error: any) {
    throw new ApiError(`Google OAuth exchange error: ${error.message}`, 500);
  }

  if (resp.data.error) {
    throw new ApiError(
      `Google OAuth failed: ${resp.data.error_description || resp.data.error}`,
      400,
    );
  }

  const { access_token, refresh_token, expires_in } = resp.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

  // Upsert into OAuthToken collection with provider = "google"
  const filter = { userId, provider: 'google' as const };
  const update = { accessToken: access_token, refreshToken: refresh_token, expiresAt };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  const tokenDoc = await OAuthToken.findOneAndUpdate(filter, update, options).lean();
  return tokenDoc as IOAuthToken;
}

/**
 * Refresh a Google access token when expired, using the stored refresh token.
 */
export async function refreshGoogleAccessToken(tokenDoc: IOAuthToken): Promise<string> {
  if (!tokenDoc.refreshToken) {
    throw new ApiError('No Google refresh token available', 400);
  }

  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = {
    client_id: config.oauth.google.clientId,
    client_secret: config.oauth.google.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: tokenDoc.refreshToken,
  };

  let resp;
  try {
    resp = await axios.post(tokenUrl, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (error: any) {
    throw new ApiError(`Google token refresh error: ${error.message}`, 500);
  }

  if (resp.data.error) {
    throw new ApiError(
      `Google refresh failed: ${resp.data.error_description || resp.data.error}`,
      400,
    );
  }

  const { access_token, expires_in } = resp.data;
  const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

  await OAuthToken.updateOne(
    { _id: tokenDoc._id },
    { accessToken: access_token, expiresAt },
  ).exec();

  return access_token;
}

/**
 * Retrieve a valid Gmail access token (refreshing if expired).
 * Returns an object containing:
 *   - token: the current access token
 *   - refreshToken: the stored refresh token (needed by Nodemailer)
 */
export async function getGmailAccessToken(
  userId: string,
): Promise<{ token: string; refreshToken: string }> {
  const tokenDoc = await OAuthToken.findOne({ userId, provider: 'google' }).lean();
  if (!tokenDoc) {
    throw new ApiError('Google not connected', 404);
  }

  let accessToken = tokenDoc.accessToken;
  if (tokenDoc.expiresAt && new Date() > tokenDoc.expiresAt) {
    accessToken = await refreshGoogleAccessToken(tokenDoc as IOAuthToken);
  }
  if (!tokenDoc.refreshToken) {
    throw new ApiError('No Google refresh token available', 400);
  }
  return { token: accessToken, refreshToken: tokenDoc.refreshToken };
}
