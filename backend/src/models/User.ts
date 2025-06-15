import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILeanUser {
  _id: string;
  email: string;
  gmail?: string;
  name: string;
  password: string;
  isActive: boolean;
  slackUserId?: string;
  slackAccessToken?: string;
  googleAccessToken?: string;
  zohoAccessToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Include all necessary Mongoose Document methods and properties
export interface IUser extends Document {
  email: string;
  gmail?: string;
  name: string;
  password: string;
  isActive: boolean;
  slackUserId?: string;
  slackAccessToken?: string;
  googleAccessToken?: string;
  zohoAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;

  // Custom methods
  comparePassword(candidate: string): Promise<boolean>;

  // Make it compatible with lean() operations
  toObject(options?: any): ILeanUser;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    gmail: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    slackUserId: { type: String },
    slackAccessToken: { type: String },
    googleAccessToken: { type: String },
    zohoAccessToken: { type: String },
  },
  { timestamps: true },
);

if (userSchema.path('password')) {
  userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.password!);
  };
}

const User = model<IUser>('User', userSchema);
export default User;
