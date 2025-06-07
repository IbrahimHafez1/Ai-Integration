import { OAuthToken } from '../models/OAuthToken.js';
import User from '../models/User.js';

async function getTokens(provider: string, email: string) {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new Error(`No user found for ${email}`);
  const tokenDoc = await OAuthToken.findOne({ provider, userId: user._id }).lean();
  if (!tokenDoc) throw new Error(`No tokens found for ${provider}`);
  return tokenDoc;
}

export default { getTokens };
