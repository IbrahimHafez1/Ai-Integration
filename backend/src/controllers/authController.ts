// controllers/authController.js
import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
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

function isString(value: any): value is string {
  return typeof value === 'string';
}

export async function handleSlackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;

    if (!isString(code)) {
      throw new ApiError('Invalid or missing OAuth code', 400);
    }

    return res.redirect(`/slack/oauth-callback?code=${encodeURIComponent(code)}`);
  } catch (error) {
    next(error);
  }
}

export async function saveSlackToken(req: any, res: Response, next: NextFunction) {
  try {
    const code = req.query.code;
    const userId = req.user?._id;

    if (!code || !userId) {
      throw new ApiError('Missing OAuth code or user authentication', 400);
    }

    await exchangeSlackCodeAndSave(userId, code);

    res.send('Slack connected successfully!');
    return;
  } catch (error) {
    next(error);
  }
}
