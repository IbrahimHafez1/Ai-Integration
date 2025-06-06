// controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { ApiError } from '../utils/errors.js';

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

/**
 * Handles Slack OAuth callback.
 * Extracts 'code' query param and redirects to frontend callback route.
 */
export async function handleSlackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;

    if (!isString(code)) {
      throw new ApiError('Invalid or missing OAuth code', 400);
    }

    // Redirect to frontend route where the code can be exchanged for token
    return res.redirect(`/slack/oauth-callback?code=${encodeURIComponent(code)}`);
  } catch (error) {
    next(error);
  }
}

/**
 * Exchanges the Slack OAuth code for an access token and saves it to the user.
 * Requires authenticated user (req.user) and OAuth code in query.
 */
export async function saveSlackToken(
  req: Request & { user?: { _id?: string } },
  res: Response,
  next: NextFunction,
) {
  try {
    const code = req.query.code;
    const userId = req.user?._id;

    if (!isString(code) || !userId) {
      throw new ApiError('Missing OAuth code or user authentication', 400);
    }

    await exchangeSlackCodeAndSave(userId, code);

    res.json({ success: true, message: 'Slack connected successfully!' });
    return;
  } catch (error) {
    next(error);
  }
}
