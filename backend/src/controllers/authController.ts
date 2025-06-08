// controllers/authController.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { ApiError } from '../utils/errors.js';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { google } from 'googleapis';
import { OAuthToken } from '../models/OAuthToken.js';
import axios from 'axios';

/**
 * Redirect user to Slack OAuth v2 authorize page.
 * Includes necessary query params and redirect URI.
 */
export function redirectToSlack(req: any, res: Response) {
  const { clientId, redirectUri } = config.oauth.slack;

  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', 'channels:read,channels:history,users:read');
  slackUrl.searchParams.set('redirect_uri', redirectUri);
  res.json({ redirectUrl: slackUrl.toString() });
  return;
  return res.redirect(slackUrl.toString());
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Helper to get env variable or throw
function getEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing environment variable: ${name}`);
  return val;
}

export async function handleSlackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state } = req.query;

    if (!isString(code)) {
      throw new ApiError('Invalid or missing OAuth code', 400);
    }
    if (!isString(state)) {
      throw new ApiError('Missing state parameter', 400);
    }

    // Redirect to the front‐end SlackOAuthHandler with both code & state:
    const redirectUrl = `${config.frontendBaseUrl}/slack/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Exchanges the Slack OAuth code for an access token and saves it to the user.
 * Requires authenticated user (req.user) and OAuth code in query.
 */
export async function saveSlackToken(req: any, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;
    const userId = req.query.userId;

    if (!isString(code) || !isString(userId)) {
      throw new ApiError('Missing OAuth code or userId', 400);
    }

    // Now exchange the Slack code for a token and save it
    await exchangeSlackCodeAndSave(userId, code);

    res.json({ success: true, message: 'Slack connected successfully!' });
    return;
  } catch (err) {
    next(err);
  }
}

const googleOauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const googleAuth = (req: any, res: Response) => {
  const authUrl = googleOauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  });
  res.redirect(authUrl);
};

export const googleCallback: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const userId = req.user?.id;
  if (!code || !userId) res.status(400).send('Missing code or user');

  try {
    const { tokens } = await googleOauth2Client.getToken(code);
    googleOauth2Client.setCredentials(tokens);

    const accessToken = tokens.access_token!;
    const refreshToken = tokens.refresh_token!;
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

    await OAuthToken.findOneAndUpdate(
      { userId, provider: 'google' },
      { accessToken, refreshToken, expiresAt },
      { upsert: true },
    );
    res.send('Google account linked successfully');
    return;
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).send('Authentication failed');
    return;
  }
};

export const zohoAuth = (req: any, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.ZOHO_CLIENT_ID!,
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    response_type: 'code',
    scope: 'ZohoCRM.settings.ALL',
    access_type: 'offline',
    prompt: 'consent',
  });
  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
  res.redirect(authUrl);
  return;
};

export const zohoCallback: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const userId = req.user?.id;
  if (!code || !userId) res.status(400).send('Missing code or user');

  try {
    const tokenRes = await axios.post(
      'https://accounts.zoho.com/oauth/v2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        redirect_uri: process.env.ZOHO_REDIRECT_URI!,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const data = tokenRes.data;
    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const expiresInSec = data.expires_in;

    const expiresAt = new Date(Date.now() + expiresInSec * 1000);

    await OAuthToken.findOneAndUpdate(
      { userId, provider: 'zoho' },
      { accessToken, refreshToken, expiresAt },
      { upsert: true },
    );
    res.send('Zoho account linked successfully');
    return;
  } catch (err) {
    console.error('Zoho OAuth error:', err);
    res.status(500).send('Authentication failed');
    return;
  }
};
