import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { exchangeSlackCodeAndSave } from '../services/slackOAuthService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/errors.js';

export function redirectToSlack(req: Request, res: Response) {
  const { clientId, redirectUri } = config.oauth.slack;
  const slackUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackUrl.searchParams.set('client_id', clientId);
  slackUrl.searchParams.set('scope', 'channels:read,channels:history,users:read');
  slackUrl.searchParams.set('redirect_uri', redirectUri);
  console.log(slackUrl.toString());
  return res.redirect(slackUrl.toString());
}

export async function handleSlackCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string;
    const userId = (req as any).user.id;
    if (!code || !userId) throw new ApiError('Invalid request', 400);

    await exchangeSlackCodeAndSave(userId, code);
    sendSuccess(res, null, 'Slack connected successfully');
    return;
  } catch (err) {
    next(err);
  }
}
