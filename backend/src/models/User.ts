import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string;
  isActive: boolean;
  slackAccessToken?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    slackAccessToken: { type: String },
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
