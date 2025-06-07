import { Request, Response, NextFunction } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import config from '../config/index.js';
import { upsertUserFromGoogle, createJwtForUser } from '../services/googleAuthService.js';

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

export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const code = String(req.query.code);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.oauth.google.clientId,
    });
    const payload = ticket.getPayload() as TokenPayload;

    const user = await upsertUserFromGoogle({
      googleId: payload.sub!,
      email: payload.email!,
      name: payload.name!,
      avatar: payload.picture!,
    });

    const jwt = createJwtForUser(user);

    res.cookie('token', jwt, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.redirect(`${config.frontendBaseUrl}/connect/google`);
  } catch (err) {
    next(err as Error);
  }
};
