// controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { ApiError } from '../utils/errors.js';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Redirect user to Slack OAuth v2 authorize page.
 * Includes necessary query params and redirect URI.
 */
export function redirectToSlack(req: Request, res: Response) {
  const { clientId, redirectUri } = config.oauth.slack;

  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', 'channels:read,channels:history,users:read');
  slackUrl.searchParams.set('redirect_uri', redirectUri);

  // Optional: Include state param for CSRF protection or user identification
  // e.g. slackUrl.searchParams.set('state', req.user?.id || '');

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
    return res.redirect(
      `${config.frontendBaseUrl}/slack/oauth-callback?` +
        `code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Exchanges the Slack OAuth code for an access token and saves it to the user.
 * Requires authenticated user (req.user) and OAuth code in query.
 */
export async function saveSlackToken(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;
    const userToken = req.query.userToken;

    if (!isString(code) || !isString(userToken)) {
      throw new ApiError('Missing OAuth code or user token', 400);
    }

    // Verify & decode the JWT that was passed in `state`
    let payload: JwtPayload;
    try {
      payload = jwt.verify(userToken, process.env.API_JWT_SECRET!) as JwtPayload;
    } catch {
      throw new ApiError('Invalid user token', 401);
    }

    // userId should be in the JWT’s payload (e.g. { userId: '…', iat, exp })
    const userId = payload.userId as string;
    if (!userId) {
      throw new ApiError('Invalid JWT payload: no userId', 400);
    }

    // Now exchange the Slack code for a token and save it
    await exchangeSlackCodeAndSave(userId, code);

    res.json({ success: true, message: 'Slack connected successfully!' });
    return;
  } catch (err) {
    next(err);
  }
}
