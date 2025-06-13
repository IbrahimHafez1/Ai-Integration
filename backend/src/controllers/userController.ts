import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User.js';
import config from '../config/index.js';
import { sendSuccess } from '../utils/response.js';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new ApiError('Missing fields', 400);

    const existing = await User.findOne({ email }).lean();
    if (existing) throw new ApiError('Email already in use', 409);

    const user = new User({ name, email, password });
    await user.save();

    sendSuccess(res, { id: user._id, email: user.email }, 'User registered');
    return;
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info(req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError('Missing fields', 400);
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const userDoc = (await User.findById(user._id)) as IUser;
    if (!userDoc) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isMatch = await userDoc!.comparePassword(password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }

    const userId = user._id.toString();
    const secret = config.jwt.secret as Secret;
    const expiresIn = config.jwt.expiresIn as SignOptions['expiresIn'];

    const token = jwt.sign({ id: userId, email: user.email }, secret, { expiresIn });

    sendSuccess(res, { token }, 'Login successful');
    return;
  } catch (err) {
    next(err);
  }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user._id;
    const user = await User.findById(userId).select('name email isActive').lean();
    if (!user) throw new ApiError('User not found', 404);
    sendSuccess(res, user, 'User profile');
    return;
  } catch (err) {
    next(err);
  }
}
