// controllers/authController.js
import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/errors.js';

/**
 * Redirect user to Slack’s OAuth v2 authorize page.
 */
export function redirectToSlack(req: Request, res: Response) {
  const { clientId, redirectUri } = config.oauth.slack;
  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', 'channels:read,channels:history,users:read');
  slackUrl.searchParams.set('redirect_uri', redirectUri);
  // It’s a good idea to include state to prevent CSRF --- omitted here for brevity
  return res.redirect(slackUrl.toString());
}

/**
 * Handle Slack’s OAuth callback:
 *   1) Exchange “code” for tokens
 *   2) Save tokens in DB
 *   3) Return a JSON success
 */
export async function handleSlackCallback(req: any, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;
    const userId = req.user?.id;
    if (!code || !userId) {
      throw new ApiError('Missing code or userId', 400);
    }

    await exchangeSlackCodeAndSave(userId, code);
    sendSuccess(res, null, 'Slack connected successfully');
    return;
  } catch (err) {
    next(err);
  }
}
