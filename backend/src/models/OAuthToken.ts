import { Schema, model, Document, ObjectId } from 'mongoose';

export interface IOAuthToken extends Document {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  provider: string;
}

const oauthTokenSchema = new Schema<IOAuthToken>(
  {
    userId: { type: String, ref: 'User', required: true, index: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    provider: { type: String, required: true },
  },
  { timestamps: true },
);

export const OAuthToken = model<IOAuthToken>('OAuthToken', oauthTokenSchema);
