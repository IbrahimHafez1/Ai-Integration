// models/OAuthToken.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

const OAuthTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, required: true, enum: ['google', 'zoho'], index: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

// Ensure one doc per (userId, provider)
OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const OAuthToken = mongoose.model<IOAuthToken>('OAuthToken', OAuthTokenSchema);
