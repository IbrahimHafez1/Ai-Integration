import { Request, Response, NextFunction, RequestHandler } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { ApiError } from '../utils/errors.js';
import { google } from 'googleapis';
import { OAuthToken } from '../models/OAuthToken.js';
import axios from 'axios';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

export function redirectToSlack(req: any, res: Response) {
  const { clientId, redirectUri } = config.oauth.slack;

  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', 'channels:read,channels:history,users:read');
  slackUrl.searchParams.set('redirect_uri', redirectUri);
  return res.redirect(slackUrl.toString());
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
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

    const redirectUrl = `${config.frontendBaseUrl}/slack/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
}

export async function saveSlackToken(req: any, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;
    const userId = req.query.userId;

    if (!isString(code) || !isString(userId)) {
      throw new ApiError('Missing OAuth code or userId', 400);
    }

    await exchangeSlackCodeAndSave(userId, code);

    res.json({ success: true, message: 'Slack connected successfully!' });
    return;
  } catch (err) {
    next(err);
  }
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

export const googleAuth: RequestHandler = (req, res) => {
  const userId = String(req.query.userId);
  const state = encodeURIComponent(userId);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/userinfo.email'],
    state,
  });

  res.redirect(authUrl);
};

export const googleCallback: RequestHandler = async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };

  if (!code || !state) {
    res.status(400).send('Missing code or state');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email || !profile.verified_email) {
      throw new Error('Google account has no verified email');
    }

    const userId = decodeURIComponent(state);

    await Promise.all([
      OAuthToken.findOneAndUpdate(
        { userId, provider: 'google' },
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          userId,
          provider: 'google',
        },
        { upsert: true, new: true },
      ),
      User.findByIdAndUpdate(userId, {
        $set: {
          gmail: profile.email,
          googleAccessToken: tokens.access_token,
        },
      }),
    ]);

    res.redirect(`${process.env.FRONTEND_BASE_URL}/integrations`);
    return;
  } catch (err: any) {
    console.error('Google OAuth error:', err);
    res.status(500).send('Authentication failed');
    return;
  }
};

export const zohoAuth = (req: any, res: Response) => {
  const { userId } = req.query;
  const state = encodeURIComponent(userId);
  const params = new URLSearchParams({
    client_id: process.env.ZOHO_CLIENT_ID!,
    redirect_uri: process.env.ZOHO_REDIRECT_URI!,
    response_type: 'code',
    scope: 'ZohoCRM.modules.leads.ALL ZohoCRM.settings.ALL',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
  return res.redirect(authUrl);
};

export const zohoCallback: RequestHandler = async (req: any, res: Response): Promise<void> => {
  const { code, state } = req.query;
  const userId = state;

  if (!code || !userId) {
    res.status(400).send('Missing code or user');
    return;
  }

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

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    const token = await OAuthToken.findOneAndUpdate(
      { userId, provider: 'zoho' },
      {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        userId,
        provider: 'zoho',
      },
      { upsert: true, new: true },
    );

    if (!token) {
      res.status(500).send('Failed to save Zoho token');
      return;
    }

    await User.findOneAndUpdate({ _id: userId }, { zohoAccessToken: token._id });

    res.redirect(`${config.frontendBaseUrl}/integrations`);

    return;
  } catch (err) {
    console.error('Zoho OAuth error:', err);
    res.status(500).send('Authentication failed');
    return;
  }
};

export const checkOAuthStatus = async (req: any, res: Response) => {
  try {
    const userId = req?.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }

    const user = await User.findById(userId)
      .select('slackAccessToken googleAccessToken zohoAccessToken')
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        data: null,
        message: 'User not found',
      });
      return;
    }

    const connected = {
      slack: Boolean(user.slackAccessToken),
      google: Boolean(user.googleAccessToken),
      zoho: Boolean(user.zohoAccessToken),
    };

    res.status(200).json({
      success: true,
      data: connected,
      message: 'OAuth connection statuses retrieved successfully',
    });
    return;
  } catch (error: any) {
    logger.error('Error checking OAuth connection statuses', {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      data: null,
      message: 'Internal server error',
    });
    return;
  }
};
