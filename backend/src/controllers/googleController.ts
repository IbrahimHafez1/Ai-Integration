import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import config from '../config/index.js';
import { OAuthToken } from '../models/OAuthToken.js';
import { createJwtForUser, upsertUserFromGoogle } from '../services/googleOAuthService.js';
import { ApiError } from '../utils/errors.js';

const oauth2Client = new OAuth2Client(
  config.oauth.google.clientId,
  config.oauth.google.clientSecret,
  config.oauth.google.redirectUri,
);

export const redirectToGoogle = (_req: Request, res: Response): void => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'select_account',
  });
  res.redirect(url);
};

export const handleGoogleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = String(req.query.code);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new ApiError('Missing refresh_token. Re-authentication is required.', 400);
    }

    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.oauth.google.clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.sub) {
      throw new ApiError('Invalid Google user payload', 400);
    }

    const user = await upsertUserFromGoogle({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || '',
    });

    const jwt = createJwtForUser(user);

    await OAuthToken.findOneAndUpdate(
      { userId: user._id, provider: 'google' },
      {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        provider: 'google',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.cookie('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.redirect(`${config.frontendBaseUrl}/connect/google`);
  } catch (err) {
    next(err);
  }
};
