import { Types } from 'mongoose';
import UserModel, { IUser } from '../models/User.js';
import { SignOptions, Secret } from 'jsonwebtoken';
import config from '../config/index.js';
import pkg from 'jsonwebtoken';

const { sign } = pkg;

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}

export async function upsertUserFromGoogle(data: GoogleUser): Promise<IUser> {
  const filter = { googleId: data.googleId };
  const update = { email: data.email, name: data.name };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const user = await UserModel.findOneAndUpdate(filter, update, options).lean();
  return user as IUser;
}

export function createJwtForUser(user: IUser): string {
  const userId = (user._id as Types.ObjectId).toString();
  const payload = { sub: userId, email: user.email };
  const secret: Secret = config.jwt.secret;
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  };
  return sign(payload, secret, options);
}
