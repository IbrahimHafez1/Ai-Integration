import { OAuthToken } from '../models/OAuthToken.js';

async function getTokens(provider: string, userId: string) {
  const tokenDoc = await OAuthToken.findOne({ provider, userId }).lean();
  if (!tokenDoc) throw new Error(`No tokens found for ${provider}`);
  return tokenDoc;
}

async function saveTokens(provider: string, userId: string, tokenResponse: any) {
  const filter = { provider, userId };
  const update: any = {
    accessToken: tokenResponse.access_token || tokenResponse.accessToken,
    refreshToken: tokenResponse.refresh_token || tokenResponse.refreshToken,
  };
  if (tokenResponse.expires_in) {
    update.expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  }
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return OAuthToken.findOneAndUpdate(filter, update, options);
}

export default { getTokens, saveTokens };
